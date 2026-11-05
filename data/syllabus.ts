// B.Cyber 2027 — full syllabus, topic > subtopic > task.
// Source: bcyber-syllabus-checklist.md (740 h across 10 domains).
// Task ids are stable and used as the key in Supabase / local storage.
// kind: 'task' (default) | 'milestone' (hard gate) | 'build' (portfolio artifact)

export type TaskKind = 'task' | 'milestone' | 'build';

export interface Task {
  id: string;
  title: string;
  kind: TaskKind;
}

export interface Subtopic {
  id: string;
  title: string;
  hours: number;
  tasks: Task[];
}

export interface Domain {
  id: string;
  num: number;
  title: string;
  hours: number;
  tier: string;
  window: string;
  blurb: string;
  accent: string;
  subtopics: Subtopic[];
}

/* helpers keep the data compact and ids deterministic */
const t = (id: string, title: string): Task => ({ id, title, kind: 'task' });
const m = (id: string, title: string): Task => ({ id, title, kind: 'milestone' });
const b = (id: string, title: string): Task => ({ id, title, kind: 'build' });

export const DOMAINS: Domain[] = [
  {
    id: 'd0',
    num: 0,
    title: 'Foundations',
    hours: 60,
    tier: 'Foundation',
    window: 'Nov – Dec 2026',
    blurb: 'Not tested directly, but nothing else works without it. Compress to three weeks.',
    accent: '#64748b',
    subtopics: [
      {
        id: 'd0s1',
        title: 'Linux & the command line',
        hours: 18,
        tasks: [
          t('d0s1t1', 'Filesystem hierarchy — /etc, /var, /usr, /home, /tmp, /opt'),
          t('d0s1t2', 'Permissions — rwx, octal, chmod, chown, chgrp, umask, SUID/SGID, sticky bit'),
          t('d0s1t3', 'Users and groups — sudo, /etc/passwd, /etc/shadow, privilege concepts'),
          t('d0s1t4', 'Processes — ps, top, htop, kill, nice, jobs, signals'),
          t('d0s1t5', 'systemd — systemctl start/stop/enable/status, journalctl'),
          t('d0s1t6', 'Package management — apt, repositories, dpkg'),
          t('d0s1t7', 'Pipes and redirection — | > >> 2> 2>&1 tee xargs'),
          t('d0s1t8', 'Text processing — grep, sed, awk, cut, sort, uniq, wc, head, tail'),
          t('d0s1t9', 'find — by name, type, size, permissions, mtime, -exec'),
          t('d0s1t10', 'Archiving and encoding — tar, gzip, zip, base64'),
          t('d0s1t11', 'Networking commands — ip a, ss, netstat, curl, wget, ping, traceroute, dig'),
          t('d0s1t12', 'SSH — keys, ssh-copy-id, config file, scp, port forwarding'),
          t('d0s1t13', 'cron syntax, environment variables, PATH'),
          t('d0s1t14', 'Bash scripting — variables, conditionals, loops, functions, exit codes'),
          m('d0s1m1', 'OverTheWire Bandit levels 0–34 complete'),
        ],
      },
      {
        id: 'd0s2',
        title: 'Python',
        hours: 20,
        tasks: [
          t('d0s2t1', 'Syntax, data types, lists/dicts/tuples, comprehensions, f-strings'),
          t('d0s2t2', 'Control flow, functions, default/keyword args, scope'),
          t('d0s2t3', 'Modules, pip, virtualenv, requirements.txt'),
          t('d0s2t4', 'File I/O, exceptions, context managers'),
          t('d0s2t5', 'OOP basics — classes, objects, inheritance, enough to read other tools'),
          t('d0s2t6', 'requests — GET/POST, headers, cookies, sessions, proxies, timeouts'),
          t('d0s2t7', 'sockets — TCP client and server, why raw sockets matter for scanning'),
          t('d0s2t8', 'argparse — a proper CLI with flags and help text'),
          t('d0s2t9', 're — patterns, groups, findall vs search'),
          t('d0s2t10', 'hashlib, base64, secrets, binascii'),
          t('d0s2t11', 'threading for concurrency — speed a scanner up without breaking it'),
          t('d0s2t12', 'subprocess — calling system tools from Python'),
          b('d0s2b1', 'Network port scanner, written and documented'),
          b('d0s2b2', 'Subdomain / DNS enumeration script'),
          b('d0s2b3', 'Hash identifier and cracker wrapper'),
          b('d0s2b4', 'Log parser that flags suspicious lines'),
          b('d0s2b5', 'Caesar / Vigenère solver in Python'),
          m('d0s2m1', 'Five small tools written, documented and pushed to GitHub'),
        ],
      },
      {
        id: 'd0s3',
        title: 'Networking fundamentals',
        hours: 14,
        tasks: [
          t('d0s3t1', 'OSI and TCP/IP models — what lives at each layer'),
          t('d0s3t2', 'IP addressing, subnets, CIDR notation, private ranges'),
          t('d0s3t3', 'TCP vs UDP — handshake, reliability, when each is used'),
          t('d0s3t4', 'Ports and common services — 21, 22, 25, 53, 80, 443, 3306, 3389'),
          t('d0s3t5', 'DNS — resolution path, record types, why DNS is an attack surface'),
          t('d0s3t6', 'HTTP and HTTPS — request/response shape, verbs, status codes'),
          t('d0s3t7', 'TLS — handshake, certificates, why interception needs a trusted cert'),
          t('d0s3t8', 'ARP, MAC addresses, switching vs routing'),
          t('d0s3t9', 'NAT and how it hides internal hosts'),
          t('d0s3t10', 'Proxies, reverse proxies, load balancers'),
          m('d0s3m1', 'Explain a full HTTPS request end to end, from DNS to decrypted response'),
        ],
      },
      {
        id: 'd0s4',
        title: 'Web fundamentals',
        hours: 8,
        tasks: [
          t('d0s4t1', 'HTML structure, forms, inputs, headers'),
          t('d0s4t2', 'JavaScript basics — DOM, events, fetch; client-side validation is not security'),
          t('d0s4t3', 'Same-origin policy and CORS, and why they exist'),
          t('d0s4t4', 'Cookies vs localStorage vs sessionStorage'),
          t('d0s4t5', 'Client-side vs server-side trust boundaries'),
          t('d0s4t6', 'How a web server is built — reverse proxy, app server, database'),
          t('d0s4t7', 'DevTools — Network tab, Application tab, reading a request'),
          m('d0s4m1', 'Read and explain the full request/response of a login flow on a site you own'),
        ],
      },
    ],
  },
  {
    id: 'd1',
    num: 1,
    title: 'Cryptography',
    hours: 55,
    tier: 'Tier A',
    window: 'Dec 2026 – Jan 2027',
    blurb: 'Your biggest genuine gap. Hackathon-tested every year. Do not skip to web because it feels easier.',
    accent: '#8b5cf6',
    subtopics: [
      {
        id: 'd1s1',
        title: 'Encoding vs encryption vs hashing',
        hours: 4,
        tasks: [
          t('d1s1t1', 'The three-way distinction, and why confusing them is the classic beginner error'),
          t('d1s1t2', 'Base64, hex, URL encoding, ASCII/UTF-8 — recognise each on sight'),
          t('d1s1t3', 'ROT13, binary, octal conversions'),
          m('d1s1m1', 'Given a random string, identify which encoding produced it'),
        ],
      },
      {
        id: 'd1s2',
        title: 'Classical cryptography',
        hours: 10,
        tasks: [
          t('d1s2t1', 'Caesar, ROT-N, Atbash'),
          t('d1s2t2', 'Substitution ciphers and frequency analysis'),
          t('d1s2t3', 'Vigenère, including key recovery'),
          t('d1s2t4', 'Transposition — rail fence, columnar'),
          t('d1s2t5', 'XOR ciphers — single-byte and repeating-key'),
          t('d1s2t6', 'Playfair and Hill cipher at concept level'),
          t('d1s2t7', "Bacon's cipher, Morse, A1Z26"),
          m('d1s2m1', 'Solve 25 classical-cipher challenges on CryptoHack and dCode without tools'),
        ],
      },
      {
        id: 'd1s3',
        title: 'Symmetric encryption',
        hours: 10,
        tasks: [
          t('d1s3t1', 'Block vs stream ciphers'),
          t('d1s3t2', 'AES — key sizes, rounds, the S-box concept'),
          t('d1s3t3', 'Modes of operation — ECB, CBC, CTR, GCM'),
          t('d1s3t4', 'Why ECB leaks structure, and how to spot it in an image or file'),
          t('d1s3t5', 'IVs and nonces — what breaks when they are reused'),
          t('d1s3t6', 'Padding and padding-oracle concepts'),
          m('d1s3m1', 'Detect ECB vs CBC from ciphertext alone, and explain the attack'),
        ],
      },
      {
        id: 'd1s4',
        title: 'Hashing',
        hours: 8,
        tasks: [
          t('d1s4t1', 'MD5, SHA-1, SHA-256, SHA-512 — properties and output sizes'),
          t('d1s4t2', 'Salting, peppering, and why unsalted hashes fall to rainbow tables'),
          t('d1s4t3', 'Password hashing — bcrypt, scrypt, Argon2, work factors'),
          t('d1s4t4', 'HMAC and where it differs from a plain hash'),
          t('d1s4t5', 'Length extension weaknesses'),
          t('d1s4t6', 'Hash identification and cracking workflow — hashid, hashcat, john'),
          m('d1s4m1', 'Crack a mixed set of 10 hashes and explain the choice of attack per hash'),
        ],
      },
      {
        id: 'd1s5',
        title: 'Asymmetric cryptography',
        hours: 12,
        tasks: [
          t('d1s5t1', 'Public/private key pairs and the one-way relationship'),
          t('d1s5t2', 'RSA — key generation from primes, e and d, why factoring breaks it'),
          t('d1s5t3', 'Diffie–Hellman key exchange'),
          t('d1s5t4', 'Elliptic curve cryptography at concept level'),
          t('d1s5t5', 'Digital signatures — signing vs encrypting'),
          t('d1s5t6', 'Certificates, chains of trust, and how validation actually fails'),
          t('d1s5t7', 'Common implementation mistakes — small e, shared primes, weak randomness'),
          m('d1s5m1', 'Break two deliberately weak RSA challenges and write up the maths'),
        ],
      },
      {
        id: 'd1s6',
        title: 'Cryptography practice',
        hours: 11,
        tasks: [
          t('d1s6t1', 'CryptoHack — Introduction and Symmetric Cryptography tracks'),
          t('d1s6t2', 'CryptoHack — Public Key and Mathematics tracks'),
          t('d1s6t3', 'CyberChef fluency — build a decode chain from scratch'),
          t('d1s6t4', 'PyCryptodome — encrypt, decrypt and verify from Python'),
          m('d1s6m1', 'Solve 30 CryptoHack challenges in total'),
          m('d1s6m2', 'Write two long-form crypto write-ups with the maths shown'),
        ],
      },
    ],
  },
  {
    id: 'd2',
    num: 2,
    title: 'Web security',
    hours: 130,
    tier: 'Tier A',
    window: 'Jan – Mar 2027',
    blurb: 'The largest block and the highest weight. Most of your existing experience sits here — move fast, but do not skip the parts you have never touched.',
    accent: '#f59e0b',
    subtopics: [
      {
        id: 'd2s1',
        title: 'Reconnaissance & mapping',
        hours: 10,
        tasks: [
          t('d2s1t1', 'Manual browsing with interception on — build a site map as you go'),
          t('d2s1t2', 'Content discovery — directory and file brute forcing, wordlist selection'),
          t('d2s1t3', 'Virtual host discovery'),
          t('d2s1t4', 'Fingerprinting — server, framework, language, CMS, versions'),
          t('d2s1t5', 'Reading JavaScript for hidden endpoints and keys'),
          m('d2s1m1', 'Produce a written attack-surface map for one deliberately vulnerable app'),
        ],
      },
      {
        id: 'd2s2',
        title: 'Burp Suite',
        hours: 10,
        tasks: [
          t('d2s2t1', 'Proxy setup, scope, and browser certificate trust'),
          t('d2s2t2', 'Repeater — manual request manipulation workflow'),
          t('d2s2t3', 'Intruder — attack types, payload sets, grep matching'),
          t('d2s2t4', 'Decoder and Comparer'),
          t('d2s2t5', 'Scanner configuration and reading its output critically'),
          t('d2s2t6', 'Extensions — installing and using the useful ones'),
          m('d2s2m1', 'Burp becomes muscle memory, not a tool you look up'),
        ],
      },
      {
        id: 'd2s3',
        title: 'Injection',
        hours: 25,
        tasks: [
          t('d2s3t1', 'SQL injection — syntax, UNION-based, error-based'),
          t('d2s3t2', 'SQL injection — blind boolean and blind time-based'),
          t('d2s3t3', 'SQL injection — auth bypass, reading files, second-order'),
          t('d2s3t4', 'SQL injection defences — parameterised queries, WAFs, least privilege'),
          t('d2s3t5', 'Command injection — direct, blind, out-of-band'),
          t('d2s3t6', 'NoSQL injection — MongoDB operators, auth bypass'),
          t('d2s3t7', 'Template injection (SSTI) — detecting, identifying the engine, exploiting'),
          t('d2s3t8', 'XML external entities (XXE) — file read, SSRF chaining'),
          t('d2s3t9', 'LDAP and XPath injection at concept level'),
          m('d2s3m1', 'All PortSwigger SQLi, command injection, SSTI and XXE labs complete'),
        ],
      },
      {
        id: 'd2s4',
        title: 'Cross-site scripting',
        hours: 18,
        tasks: [
          t('d2s4t1', 'Reflected XSS — what reflects, and where'),
          t('d2s4t2', 'Stored XSS — persistence and blast radius'),
          t('d2s4t3', 'DOM-based XSS — sources, sinks, why server filters miss it'),
          t('d2s4t4', 'Context matters — HTML, attribute, JavaScript string, URL, CSS'),
          t('d2s4t5', 'Filter bypass concepts'),
          t('d2s4t6', 'Content Security Policy — what it stops and what it does not'),
          t('d2s4t7', 'Impact — session theft, CSRF bypass, keylogging, phishing'),
          t('d2s4t8', 'Defences — output encoding, HttpOnly, SameSite'),
          m('d2s4m1', 'All PortSwigger XSS labs complete'),
        ],
      },
      {
        id: 'd2s5',
        title: 'Access control & authentication',
        hours: 22,
        tasks: [
          t('d2s5t1', 'Insecure direct object references — horizontal escalation'),
          t('d2s5t2', 'Vertical escalation and missing function-level checks'),
          t('d2s5t3', 'Path traversal and file inclusion — local and remote'),
          t('d2s5t4', 'Forced browsing to unlinked functionality'),
          t('d2s5t5', 'Username enumeration and brute-force resistance'),
          t('d2s5t6', 'Session management — fixation, prediction, invalidation'),
          t('d2s5t7', 'JSON Web Tokens — structure, alg confusion, weak secrets, none algorithm'),
          t('d2s5t8', 'OAuth 2.0 — flows, redirect URI manipulation, token leakage'),
          t('d2s5t9', 'Multi-factor authentication bypass techniques'),
          m('d2s5m1', 'All PortSwigger access control and authentication labs complete'),
        ],
      },
      {
        id: 'd2s6',
        title: 'Server-side & business logic',
        hours: 20,
        tasks: [
          t('d2s6t1', 'Server-side request forgery — internal reach and cloud metadata'),
          t('d2s6t2', 'File upload weaknesses — extension, content-type, magic bytes, chains'),
          t('d2s6t3', 'Unsafe deserialisation at concept and common-case level'),
          t('d2s6t4', 'Race conditions and time-of-check to time-of-use'),
          t('d2s6t5', 'Business logic — price manipulation, quantity abuse, workflow bypass'),
          t('d2s6t6', 'Request smuggling — know the concept and what it implies'),
          t('d2s6t7', 'Host header injection and web cache poisoning'),
          t('d2s6t8', 'Information disclosure — errors, debug endpoints, backups, repos'),
          m('d2s6m1', 'All PortSwigger SSRF, file upload, deserialisation and logic labs complete'),
        ],
      },
      {
        id: 'd2s7',
        title: 'Client-side & advanced',
        hours: 15,
        tasks: [
          t('d2s7t1', 'Cross-site request forgery — tokens, SameSite, bypass approaches'),
          t('d2s7t2', 'Clickjacking and frame defences'),
          t('d2s7t3', 'CORS misconfiguration — origin reflection, wildcard trust, null origin'),
          t('d2s7t4', 'WebSocket security'),
          t('d2s7t5', 'Subdomain takeover'),
          t('d2s7t6', 'Web cache deception'),
          m('d2s7m1', 'All PortSwigger client-side labs complete'),
        ],
      },
      {
        id: 'd2s8',
        title: 'Consolidation',
        hours: 10,
        tasks: [
          t('d2s8t1', 'Write up 8 labs long-form, explaining cause not just steps'),
          t('d2s8t2', 'Complete a deliberately vulnerable app end to end unaided'),
          b('d2s8b1', 'Personal web testing checklist mapped to the OWASP Top 10'),
          m('d2s8m1', '60+ PortSwigger labs completed'),
        ],
      },
    ],
  },
  {
    id: 'd3',
    num: 3,
    title: 'API security',
    hours: 55,
    tier: 'Tier A',
    window: 'Mar – Apr 2027',
    blurb: 'A named hackathon topic and the one area with zero evidence in your portfolio. Treat it as new material, not revision.',
    accent: '#06b6d4',
    subtopics: [
      {
        id: 'd3s1',
        title: 'Foundations',
        hours: 12,
        tasks: [
          t('d3s1t1', 'REST principles — resources, verbs, idempotency, statelessness'),
          t('d3s1t2', 'JSON — nesting, arrays, type confusion'),
          t('d3s1t3', 'Status codes and what each one leaks'),
          t('d3s1t4', 'API versioning, deprecation and undocumented endpoints'),
          t('d3s1t5', 'GraphQL — queries, mutations, introspection, common weaknesses'),
          t('d3s1t6', 'SOAP and XML APIs at concept level'),
          t('d3s1t7', 'OpenAPI / Swagger specs — reading them to map the test surface'),
          m('d3s1m1', 'Map a real public API surface from documentation alone'),
        ],
      },
      {
        id: 'd3s2',
        title: 'Authentication & authorisation',
        hours: 15,
        tasks: [
          t('d3s2t1', 'API keys — where they leak, how they are validated'),
          t('d3s2t2', 'Bearer tokens and how they differ from cookies in transit'),
          t('d3s2t3', 'JWT in APIs — claims, expiry, signature verification pitfalls'),
          t('d3s2t4', 'OAuth 2.0 — client credentials, authorisation code, PKCE'),
          t('d3s2t5', 'Token scope and permission boundaries'),
          t('d3s2t6', 'Broken object-level authorisation — OWASP API #1'),
          t('d3s2t7', 'Broken function-level authorisation'),
          t('d3s2t8', 'Mass assignment and excessive data exposure'),
          m('d3s2m1', 'Exploit BOLA and mass assignment unaided on a practice API'),
        ],
      },
      {
        id: 'd3s3',
        title: 'API-specific attacks',
        hours: 20,
        tasks: [
          t('d3s3t1', 'Rate limiting — absence, bypass, and why it matters'),
          t('d3s3t2', 'Resource exhaustion and unrestricted consumption'),
          t('d3s3t3', 'Improper inventory management — old versions, shadow APIs'),
          t('d3s3t4', 'Unsafe consumption of third-party APIs'),
          t('d3s3t5', 'Injection into JSON, XML and query parameters'),
          t('d3s3t6', 'Server-side parameter pollution'),
          t('d3s3t7', 'GraphQL introspection abuse and query depth / batching attacks'),
          m('d3s3m1', 'Work through the OWASP API Top 10 against a vulnerable practice API'),
        ],
      },
      {
        id: 'd3s4',
        title: 'Tooling & practice',
        hours: 8,
        tasks: [
          t('d3s4t1', 'Postman — collections, environments, scripting, auth inheritance'),
          t('d3s4t2', 'Burp for APIs — request manipulation and response comparison'),
          t('d3s4t3', 'curl and jq fluency from the terminal'),
          b('d3s4b1', 'An API fuzzing script that takes an OpenAPI spec as input'),
          m('d3s4m1', 'Full API assessment written up as a client-style report with severity ratings'),
        ],
      },
    ],
  },
  {
    id: 'd4',
    num: 4,
    title: 'Network security',
    hours: 60,
    tier: 'Tier A',
    window: 'Apr – May 2027',
    blurb: 'Hackathon-tested. You have packet-level comfort already; the gap is structured methodology and the defensive half.',
    accent: '#22c55e',
    subtopics: [
      {
        id: 'd4s1',
        title: 'Scanning & enumeration',
        hours: 15,
        tasks: [
          t('d4s1t1', 'Host discovery and the main port-scanning techniques'),
          t('d4s1t2', 'Service and version detection, OS fingerprinting, script scanning'),
          t('d4s1t3', 'Timing templates and evasion concepts'),
          t('d4s1t4', 'Service-specific enumeration — HTTP, SMB, FTP, SSH, DNS, SNMP'),
          t('d4s1t5', 'Windows environment enumeration'),
          t('d4s1t6', 'Directory and virtual host discovery'),
          m('d4s1m1', 'Full enumeration of a practice machine written up as a report'),
        ],
      },
      {
        id: 'd4s2',
        title: 'Traffic analysis',
        hours: 12,
        tasks: [
          t('d4s2t1', 'Capture and display filters, following streams'),
          t('d4s2t2', 'Reconstructing an attack sequence from a capture'),
          t('d4s2t3', 'Extracting credentials and files from captured traffic'),
          t('d4s2t4', 'Command-line capture and filtering'),
          m('d4s2m1', 'Given an unknown capture, explain what happened and in what order'),
        ],
      },
      {
        id: 'd4s3',
        title: 'Network-level attacks',
        hours: 20,
        tasks: [
          t('d4s3t1', 'ARP spoofing and man-in-the-middle — mechanics and defences'),
          t('d4s3t2', 'DNS spoofing and cache poisoning'),
          t('d4s3t3', 'DHCP starvation and rogue DHCP servers'),
          t('d4s3t4', 'VLAN hopping concepts'),
          t('d4s3t5', 'Online guessing vs offline cracking, and lockout avoidance'),
          t('d4s3t6', 'SMB and NetBIOS weaknesses, relay concepts'),
          t('d4s3t7', 'Pivoting and tunnelling from a single foothold'),
          t('d4s3t8', 'Denial of service — volumetric, protocol, application layer'),
          m('d4s3m1', 'Explain each attack plus its specific mitigation, unaided'),
        ],
      },
      {
        id: 'd4s4',
        title: 'Defensive side',
        hours: 13,
        tasks: [
          t('d4s4t1', 'Firewall rule design, stateful inspection, common misconfigurations'),
          t('d4s4t2', 'IDS/IPS — signature vs anomaly approaches'),
          t('d4s4t3', 'Network segmentation and zero trust'),
          t('d4s4t4', 'VPNs and encrypted traffic inspection'),
          t('d4s4t5', 'Log sources — firewall, DNS, proxy, endpoint — and what each reveals'),
          m('d4s4m1', 'Propose a defensible architecture for a scenario and justify each control'),
        ],
      },
    ],
  },
  {
    id: 'd5',
    num: 5,
    title: 'OSINT',
    hours: 40,
    tier: 'Tier A',
    window: 'May 2027',
    blurb: 'The smallest domain and the easiest to evidence. Every artifact here is legal and demonstrable — no authorisation needed.',
    accent: '#ec4899',
    subtopics: [
      {
        id: 'd5s1',
        title: 'Search & discovery',
        hours: 10,
        tasks: [
          t('d5s1t1', 'Search operators — site, filetype, inurl, intitle, cache'),
          t('d5s1t2', 'Alternative search engines and why results differ'),
          t('d5s1t3', 'Cached and archived pages; Wayback Machine as evidence'),
          m('d5s1m1', 'Find a specified document on a specified domain using operators only'),
        ],
      },
      {
        id: 'd5s2',
        title: 'Infrastructure OSINT',
        hours: 12,
        tasks: [
          t('d5s2t1', 'Registration records and historical registration data'),
          t('d5s2t2', 'DNS records, zone transfers, DNS history'),
          t('d5s2t3', 'Certificate transparency logs for subdomain discovery'),
          t('d5s2t4', 'Internet-wide scan engines — querying exposed services'),
          t('d5s2t5', 'IP and ASN lookups, routing, path analysis'),
          t('d5s2t6', 'Subdomain enumeration methodology'),
          m('d5s2m1', 'Complete infrastructure map of a domain you own'),
        ],
      },
      {
        id: 'd5s3',
        title: 'People & organisation OSINT',
        hours: 10,
        tasks: [
          t('d5s3t1', 'Username enumeration across platforms'),
          t('d5s3t2', 'Email investigation — headers, verification, breach lookups'),
          t('d5s3t3', 'Corporate structure, employee mapping, job posts as intelligence'),
          t('d5s3t4', 'Social media footprinting methodology'),
          t('d5s3t5', 'Legal and ethical boundaries — consent, public interest, no doxxing'),
          m('d5s3m1', 'Full OSINT profile of yourself, written up'),
        ],
      },
      {
        id: 'd5s4',
        title: 'Metadata & geolocation',
        hours: 8,
        tasks: [
          t('d5s4t1', 'Image and document metadata — what is embedded, how to extract it'),
          t('d5s4t2', 'Geolocation — landmarks, shadows, vegetation, signage, language'),
          t('d5s4t3', 'Reverse image search and its limits'),
          t('d5s4t4', 'Chronolocation — establishing when a photo was taken'),
          m('d5s4m1', 'Geolocate 5 images from clues alone, documenting the reasoning chain'),
        ],
      },
    ],
  },
  {
    id: 'd6',
    num: 6,
    title: 'Reverse engineering',
    hours: 70,
    tier: 'Tier A',
    window: 'May – Jun 2027',
    blurb: 'Your second genuine gap, and the domain most likely to sink a hackathon run. Start it earlier than feels comfortable.',
    accent: '#ef4444',
    subtopics: [
      {
        id: 'd6s1',
        title: 'Assembly & architecture',
        hours: 15,
        tasks: [
          t('d6s1t1', 'Registers — general purpose, instruction pointer, stack pointer, flags'),
          t('d6s1t2', 'Memory layout — text, data, bss, heap, stack'),
          t('d6s1t3', 'Core instruction set — mov, push, pop, lea, add, sub, cmp, jumps, call, ret'),
          t('d6s1t4', 'Calling conventions — cdecl, stdcall, fastcall, System V'),
          t('d6s1t5', 'Stack frames and how a call actually works'),
          t('d6s1t6', 'Recognising C constructs — if/else, loops, switch, arrays'),
          m('d6s1m1', 'Read a 50-instruction disassembly and reconstruct the function in pseudocode'),
        ],
      },
      {
        id: 'd6s2',
        title: 'Static analysis',
        hours: 20,
        tasks: [
          t('d6s2t1', 'File identification — magic bytes, PE vs ELF'),
          t('d6s2t2', 'Executable structure — headers, sections, imports, exports'),
          t('d6s2t3', 'ELF structure — headers, sections, segments, dynamic linking'),
          t('d6s2t4', 'Inspection utilities — strings, objdump, readelf, nm, ldd'),
          t('d6s2t5', 'Ghidra — project setup, decompiler, renaming, xrefs, data types'),
          t('d6s2t6', 'Separating library code from program logic'),
          t('d6s2t7', 'Packers and how to recognise them'),
          m('d6s2m1', 'Fully understand what a binary does without running it'),
        ],
      },
      {
        id: 'd6s3',
        title: 'Dynamic analysis',
        hours: 20,
        tasks: [
          t('d6s3t1', 'Debugger basics — breakpoints, stepping, registers, memory'),
          t('d6s3t2', 'Debugger extensions — pwndbg or GEF'),
          t('d6s3t3', 'Syscall and library call tracing'),
          t('d6s3t4', 'Monitoring filesystem, registry and network behaviour'),
          t('d6s3t5', 'Anti-debugging detection and bypass concepts'),
          t('d6s3t6', 'Sandboxing — running unknown binaries safely'),
          m('d6s3m1', "Trace a binary and identify the check that decides the correct input"),
        ],
      },
      {
        id: 'd6s4',
        title: 'Practical reversing',
        hours: 15,
        tasks: [
          t('d6s4t1', '15 crackme challenges at difficulty 1 and 2'),
          t('d6s4t2', 'Password-check binaries — locate the comparison, recover the value'),
          t('d6s4t3', 'Key validation — read the algorithm and reproduce it in Python'),
          t('d6s4t4', 'Simple unpacking'),
          t('d6s4t5', '15 reverse-engineering challenges from picoCTF'),
          b('d6s4b1', 'One tool that automates a reversing or crypto task you hit repeatedly'),
          m('d6s4m1', 'Write a Python keygen for a challenge you solved'),
        ],
      },
    ],
  },
  {
    id: 'd7',
    num: 7,
    title: 'Aptitude',
    hours: 110,
    tier: 'Tier C → A',
    window: 'Jan – Jun 2027, sprint in June',
    blurb: 'Stage 1 of selection. The hackathon is worthless if you do not clear this first. Five hours a week from January, ten in June.',
    accent: '#3b82f6',
    subtopics: [
      {
        id: 'd7s1',
        title: 'Quantitative ability',
        hours: 35,
        tasks: [
          t('d7s1t1', 'Percentages, profit/loss, discount'),
          t('d7s1t2', 'Ratio and proportion, partnership'),
          t('d7s1t3', 'Averages, mixtures and alligation'),
          t('d7s1t4', 'Time, speed, distance; time and work'),
          t('d7s1t5', 'Simple and compound interest'),
          t('d7s1t6', 'Number system — divisibility, HCF/LCM, remainders, unit digits'),
          t('d7s1t7', 'Permutations and combinations'),
          t('d7s1t8', 'Probability'),
          t('d7s1t9', 'Series — arithmetic, geometric, mixed, missing terms'),
          t('d7s1t10', 'Algebra — linear and quadratic equations, inequalities'),
          t('d7s1t11', 'Mensuration and basic geometry, trigonometry basics'),
          t('d7s1t12', 'Data interpretation — tables, bar, pie, line graphs'),
          t('d7s1t13', 'Speed maths — squares, cubes, fraction-to-percentage recall'),
          m('d7s1m1', '80%+ accuracy on any 25-question arithmetic set in 20 minutes'),
        ],
      },
      {
        id: 'd7s2',
        title: 'Logical reasoning',
        hours: 35,
        tasks: [
          t('d7s2t1', 'Number and letter series, analogies, odd one out'),
          t('d7s2t2', 'Coding–decoding'),
          t('d7s2t3', 'Blood relations, direction sense, ranking'),
          t('d7s2t4', 'Seating arrangement — linear and circular'),
          t('d7s2t5', 'Puzzles and arrangements with constraints'),
          t('d7s2t6', 'Syllogisms using Venn diagrams'),
          t('d7s2t7', 'Statement and assumption; statement and conclusion'),
          t('d7s2t8', 'Strong and weak arguments; cause and effect'),
          t('d7s2t9', 'Clocks and calendars'),
          t('d7s2t10', 'Cubes and dice'),
          t('d7s2t11', 'Figure series, mirror and water images'),
          t('d7s2t12', 'Data sufficiency'),
          m('d7s2m1', '80%+ on any 25-question reasoning set in 20 minutes'),
        ],
      },
      {
        id: 'd7s3',
        title: 'Cybersecurity aptitude',
        hours: 25,
        tasks: [
          t('d7s3t1', 'CIA triad; threat vs vulnerability vs risk'),
          t('d7s3t2', 'Authentication vs authorisation; AAA'),
          t('d7s3t3', 'Encoding vs hashing vs encryption — instant recognition'),
          t('d7s3t4', 'Attack taxonomy — what each attack targets and achieves'),
          t('d7s3t5', 'Basic networking and HTTP concepts at rapid recall'),
          t('d7s3t6', 'Simple cipher and logic puzzles solved under time pressure'),
          t('d7s3t7', 'Deduction-style OSINT puzzles'),
          t('d7s3t8', 'Law and ethics — IT Act basics, responsible disclosure, authorisation'),
          m('d7s3m1', 'Score comfortably on mixed practice sets across all three areas'),
        ],
      },
      {
        id: 'd7s4',
        title: 'Mocks & review',
        hours: 15,
        tasks: [
          t('d7s4t1', '8 full-length timed mocks, one every 10 days from April'),
          t('d7s4t2', 'Written error log — every mistake categorised by cause, not topic'),
          t('d7s4t3', 'Re-attempt every wrong question after 7 days'),
          t('d7s4t4', 'Section-order and skipping strategy rehearsed under timing'),
          m('d7s4m1', 'Mock scores trending upward across the last four attempts'),
        ],
      },
    ],
  },
  {
    id: 'd8',
    num: 8,
    title: 'Practice',
    hours: 100,
    tier: 'Tier A',
    window: 'All year, peaking Jun – Jul 2027',
    blurb: 'Reading about security does nothing. This is where the offer actually comes from.',
    accent: '#a855f7',
    subtopics: [
      {
        id: 'd8s1',
        title: 'Platform tracks',
        hours: 30,
        tasks: [
          t('d8s1t1', 'Complete Pre-Security or confirm the equivalent'),
          t('d8s1t2', 'Complete the Jr Penetration Tester path'),
          t('d8s1t3', 'Networking, web and reverse-engineering rooms'),
          t('d8s1t4', '10 easy Hack The Box machines, rooted'),
          t('d8s1t5', 'Maintain a public profile with visible progress'),
          m('d8s1m1', '100+ TryHackMe rooms completed'),
        ],
      },
      {
        id: 'd8s2',
        title: 'PortSwigger labs',
        hours: 40,
        tasks: [
          t('d8s2t1', 'All Apprentice-level labs across every category'),
          t('d8s2t2', '20+ Practitioner-level labs'),
          t('d8s2t3', 'Attempt three Expert-level labs and document the failures honestly'),
          m('d8s2m1', '60+ labs, eight written up long-form'),
        ],
      },
      {
        id: 'd8s3',
        title: 'CTF competition',
        hours: 20,
        tasks: [
          t('d8s3t1', 'Register on CTFtime and picoCTF, keep the profile public'),
          t('d8s3t2', 'Compete in at least 4 online CTFs between January and June'),
          t('d8s3t3', 'Log every event — name, date, team, category, rank'),
          t('d8s3t4', 'Join or form a team'),
          t('d8s3t5', 'Solve at least one crypto and one reversing challenge in a live CTF'),
          m('d8s3m1', 'At least 3 top-20 team finishes or 30 documented solves'),
        ],
      },
      {
        id: 'd8s4',
        title: 'Deliberate practice',
        hours: 10,
        tasks: [
          t('d8s4t1', 'Two-hour and four-hour timed lab blocks, no notes during the clock'),
          t('d8s4t2', 'Full 8-hour hackathon simulations on one target, findings written at the end'),
          t('d8s4t3', 'Present findings out loud in 5 minutes to a non-technical listener'),
          t('d8s4t4', 'Clean-desktop discipline — only the allowed toolset, no internet crutches'),
          m('d8s4m1', '4 full 8-hour hackathon simulations completed'),
        ],
      },
    ],
  },
  {
    id: 'd9',
    num: 9,
    title: 'Portfolio & evidence',
    hours: 60,
    tier: 'Evidence',
    window: 'Rolling, finalised Jun 2027',
    blurb: 'Your portfolio currently makes claims it cannot prove. This domain is about making every claim clickable.',
    accent: '#14b8a6',
    subtopics: [
      {
        id: 'd9s1',
        title: 'Write-ups',
        hours: 30,
        tasks: [
          t('d9s1t1', 'Set up a write-ups or blog section on the portfolio site'),
          t('d9s1t2', 'Write 10 technical pieces — one per domain minimum'),
          t('d9s1t3', 'Each piece needs cause, evidence, impact and fix — not just steps'),
          t('d9s1t4', 'Write up both government disclosures in responsible-disclosure form'),
          t('d9s1t5', 'Publish a sample client-style VAPT report with severity ratings'),
          m('d9s1m1', '10 published write-ups, live and indexed'),
        ],
      },
      {
        id: 'd9s2',
        title: 'Site & profiles',
        hours: 15,
        tasks: [
          t('d9s2t1', 'Fix the homepage counters so they show real numbers, not zero'),
          t('d9s2t2', 'Remove or replace the percentage skill bars with concrete evidence'),
          t('d9s2t3', 'Drop certifications that are merely planned; keep earned ones'),
          t('d9s2t4', 'Reduce "In Progress" labels — finish one thing before starting another'),
          t('d9s2t5', 'Rewrite the About section in one plain, confident paragraph'),
          t('d9s2t6', 'Add CTFtime and disclosure-platform links to the header'),
          m('d9s2m1', 'Every claim on the site is provable in one click'),
        ],
      },
      {
        id: 'd9s3',
        title: 'GitHub & tools',
        hours: 15,
        tasks: [
          t('d9s3t1', 'Rename the misspelled repository slug and add forwarding'),
          t('d9s3t2', 'Every repo gets a README — problem, approach, demo, usage, limits'),
          t('d9s3t3', 'Finish or cut the AI threat detector — no third In Progress label'),
          t('d9s3t4', 'Add tests and a clean commit history to the main public repo'),
          t('d9s3t5', 'Pin the four strongest repos on the profile'),
          b('d9s3b1', 'A crypto or reversing tool to close the evidence gap in those domains'),
          m('d9s3m1', 'Four complete repositories with READMEs and demos'),
        ],
      },
    ],
  },
];

export const TOTAL_HOURS = DOMAINS.reduce((a, d) => a + d.hours, 0);

export const ALL_TASKS: (Task & { domainId: string; subtopicId: string })[] = DOMAINS.flatMap((d) =>
  d.subtopics.flatMap((s) => s.tasks.map((task) => ({ ...task, domainId: d.id, subtopicId: s.id })))
);

export const TOTAL_TASKS = ALL_TASKS.length;
export const TOTAL_MILESTONES = ALL_TASKS.filter((x) => x.kind === 'milestone').length;

export function domainById(id: string): Domain | undefined {
  return DOMAINS.find((d) => d.id === id);
}

export function subtopicHoursByName(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of DOMAINS) for (const s of d.subtopics) out[s.id] = s.hours;
  return out;
}

/** Hours represented by each domain, used for weighted progress on the dashboard. */
export const HOURS_BY_DOMAIN: Record<string, number> = Object.fromEntries(
  DOMAINS.map((d) => [d.id, d.hours])
);
