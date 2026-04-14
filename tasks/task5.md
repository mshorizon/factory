# Tasks

Everythink todo below should be used in business template "portfolio-law":

TODO:
* fix bug endpoint: curl 'https://portfolio-law.hazelgrouse.pl/api/admin/files/list?business=portfolio-law' \
  -H 'accept: */*' \
  -H 'accept-language: pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7' \
  -b '_ga=GA1.1.533096219.1769175987; _ga_DD1F4T716Q=GS2.1.s1769175986$o1$g1$t1769177370$j26$l0$h0; admin_token=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AbXNob3Jpem9uLnBsIiwicm9sZSI6InN1cGVyLWFkbWluIiwiYnVzaW5lc3NJZCI6bnVsbCwiaWF0IjoxNzc2MTY5NTY4LCJleHAiOjE3NzYxNzA0Njh9.mj3N7kyNkSdPp9MtZw8ubYDCwTYX5JAgiMf1Q6FPhy4; admin_refresh=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NjE2OTU2OCwiZXhwIjoxNzc2Nzc0MzY4fQ.8dW6_M-brjFEa6oup3K0ovu10mSPbn2DahlOq4JK4kc' \
  -H 'priority: u=1, i' \
  -H 'referer: https://portfolio-law.hazelgrouse.pl/admin' \
  -H 'sec-ch-ua: "Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36' 

return: {
"error": "Failed to list files"
}