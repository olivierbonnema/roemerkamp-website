// Staat der Nederlanden Private Root CA - G1 (PKIoverheid).
//
// ccbrservice.rechtspraak.nl is issued under the PKIoverheid PRIVATE hierarchy:
// an official Dutch government CA that is deliberately kept out of browser and
// OS trust stores, and therefore out of Node's default trust store too. That is
// why a connection without this certificate fails with "self signed certificate
// in certificate chain" — it is not a home-made certificate, and it is not
// confidential.
//
// Published at https://cert.pkioverheid.nl/PrivateRootCA-G1.cer
// Verified 2026-09-08: the root the server itself presents is byte-for-byte
// identical to that official publication.
//   SHA-256: 02:57:CE:27:B5:24:08:E2:4E:E2:C0:94:56:40:B7:23:
//            C5:BC:66:DD:BD:A4:AD:A5:8C:60:35:76:04:F0:E6:75
//   Valid until 13 November 2028 — replace with the Logius successor before then.
//
// Embedded as a string rather than read from disk so the bundler is guaranteed
// to include it in the serverless function.

export const PKIOVERHEID_PRIVATE_ROOT_G1 = `-----BEGIN CERTIFICATE-----
MIIFhDCCA2ygAwIBAgIEAJimITANBgkqhkiG9w0BAQsFADBiMQswCQYDVQQGEwJO
TDEeMBwGA1UECgwVU3RhYXQgZGVyIE5lZGVybGFuZGVuMTMwMQYDVQQDDCpTdGFh
dCBkZXIgTmVkZXJsYW5kZW4gUHJpdmF0ZSBSb290IENBIC0gRzEwHhcNMTMxMTE0
MTM0ODU1WhcNMjgxMTEzMjMwMDAwWjBiMQswCQYDVQQGEwJOTDEeMBwGA1UECgwV
U3RhYXQgZGVyIE5lZGVybGFuZGVuMTMwMQYDVQQDDCpTdGFhdCBkZXIgTmVkZXJs
YW5kZW4gUHJpdmF0ZSBSb290IENBIC0gRzEwggIiMA0GCSqGSIb3DQEBAQUAA4IC
DwAwggIKAoICAQDaIMh56ynwnEhE7Ey54KpX5j1XDoxbHDCgXctute55RjmG2hy6
fuq++q/dCSsj38Pi/KYn/PN13EF05k39IRvakb0AQNVyHifNKXfta6Tzi5QcM4BK
09DB4Ckb6TdZTNUtWyEcAtRblYaVSQ4Xr5QODNqu2FGQucraVXqCIx81azlOE2Jb
Zli9AZKn94pP57A11dUYhxMsh70YosJEKVB8Ue4ROksHhb/nnOISG+2y9FD5M8u8
jYhp00TGZGVu5z0IFgtqX0i8GmrH0ub9AWjf/iU4MWjGVRSq0cwUHEeKRj/UD9a8
xIEn9TxIfYj+6+s4tn9dW/4PV5jc6iGJx6ExTPfOR7VHpxS4XujrZb5Ba/+oj/ON
dOfR0JSm2itCytbtjQBBL0oocIIqaqOna1cufHkcn9VleF7Zvz/8njQIpAU4J4nJ
4pE5pQ3k4ORAGNnq5R9hAqqUQGDlo3Uj8PBou0nPzQ7JNgGkN+my/lGr4rceUNK/
8CoGnYFUH+UyFtJkvlLlEkb688/IdNdGgY+vuXCAB6xfKlJjAGChFUBb6swbNeNc
tVEdUj7Weg4Jt5gXu78C2mjs9x5lcHOgMO4ZmvYJ3Ejp4k3nNa45HOIVkYrfQrrB
HzBhR0BuReAagurcbtUjJFd7BtufGVLfU3CUn1l6u3/9eG4DGH6pq+dSKQIDAQAB
o0IwQDAPBgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIBBjAdBgNVHQ4EFgQU
Kv25Kx76w4SHBtuB/4aXdQ3rAYswDQYJKoZIhvcNAQELBQADggIBAEvpmXMOOKdQ
wUPysrsdIkGJUFF+dvmsJDiOuAqV0A1nNTooL3esvDLEZAWZwKTOwRomnHzeCfS/
QxRKTkVX21pfrHf9ufDKykpzjl9uAILTS76FJ6//R0RTIPMrzknQpG2fCLR5DFEb
HWU/jWAxGmncfx6HQYl/azHaWbv0dhZOUjPdkGAQ6EPvHcyNU9yMkETdw0X6ioxq
zMwkGM893oBrMmtduiqIf3/H6HTXoRKAc+/DXZIq/pAc6eVMa6x43kokluaam9L7
8yDrlHbGd2VYAr/HZ0TjDZTtI2t2/ySTb7JjC8wL8rSqxYmLpNrnhZzPW87sl2OC
FC3re3ZhtJkIHNP85jj1gqewTC7DCW6llZdB3hBzfHWby0EX2RlcwgaMfNBEV5U0
IogccdXV+S6zWK4F+yBr0sXUrdbdMFu+g3I9CbXxt0q4eVJtoaun4M2Z+bZMqZvy
9FryBdSfhpgmJqwFz2luOhPOVCblCPhLrUeewrvuBXoZQWt1ZjuHfwJZ1dgjszVE
qwY9S0SdqCg2ZlL9s3vDIrrd3wLWrcHLQMd9gwsppNv9c7JfIJdlcZLTmF9EuL6e
CvVVrqBVqLHjva4erqYol6K/jbSfUtRCy8IlFU7LYu1KLehZKYvj3vekj3Cn08Aq
ljr/Q8Pw+OfUZTzKg4PVDQVfFqKtyosv
-----END CERTIFICATE-----
`
