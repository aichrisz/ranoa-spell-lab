"""Read-only artifact and local listener verification."""
from pathlib import Path
import socket
import struct

ROOT = Path(__file__).resolve().parent.parent
for name in ['desktop-ready.png', 'desktop-playing.png', 'mobile-ready.png', 'mobile-playing.png']:
    data = (ROOT / 'artifacts' / name).read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    width, height = struct.unpack('>II', data[16:24])
    print(f'{name}: {width}x{height}, {len(data)} bytes')
with socket.socket() as connection:
    connection.settimeout(1)
    result = connection.connect_ex(('127.0.0.1', 4184))
    assert result != 0, 'Server still listening on 4184'
    print('Port 4184: no listener; test server stopped')
