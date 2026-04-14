# Tasks

Everythink todo below should be used in business template "portfolio-law":

TODO:
* fix bug endpoint: curl 'https://portfolio-law.dev.hazelgrouse.pl/api/admin/files/upload' \
  -H 'accept: */*' \
  -H 'accept-language: pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7' \
  -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundaryn43SMDxV5lZA8oGc' \
  -b '_ga=GA1.1.533096219.1769175987; _ga_DD1F4T716Q=GS2.1.s1769175986$o1$g1$t1769177370$j26$l0$h0; lang=en; admin_token=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AbXNob3Jpem9uLnBsIiwicm9sZSI6InN1cGVyLWFkbWluIiwiYnVzaW5lc3NJZCI6bnVsbCwiaWF0IjoxNzc2MTY5NjE2LCJleHAiOjE3NzYxNzA1MTZ9.CInSBG-kiMRnHK2k95z2t0t68nzHWdmvSz5R49IAQDg; admin_refresh=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NjE2OTYxNiwiZXhwIjoxNzc2Nzc0NDE2fQ.A-wG-ssXd9R28GjktDyVmWkwN-gRGOn1dlw5otmo8J8' \
  -H 'origin: https://portfolio-law.dev.hazelgrouse.pl' \
  -H 'priority: u=1, i' \
  -H 'referer: https://portfolio-law.dev.hazelgrouse.pl/admin' \
  -H 'sec-ch-ua: "Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36' \
  --data-raw $'------WebKitFormBoundaryn43SMDxV5lZA8oGc\r\nContent-Disposition: form-data; name="file"; filename="Formularz-wniosku-o-wszczęcie-egzekucji.pdf"\r\nContent-Type: application/pdf\r\n\r\n\r\n------WebKitFormBoundaryn43SMDxV5lZA8oGc\r\nContent-Disposition: form-data; name="businessId"\r\n\r\nportfolio-law\r\n------WebKitFormBoundaryn43SMDxV5lZA8oGc--\r\n' 

return: {
"message": "relation \"business_files\" does not exist"
}