# Tasks

All tasks below:
* [x] sending email in /contact page: curl 'https://portfolio-law.hazelgrouse.pl/api/contact' \
  -H 'accept: */*' \
  -H 'accept-language: pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7' \
  -H 'content-type: application/json' \
  -b '_ga=GA1.1.533096219.1769175987; _ga_DD1F4T716Q=GS2.1.s1769175986$o1$g1$t1769177370$j26$l0$h0; admin_refresh=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NjE4MTAzMiwiZXhwIjoxNzc2Nzg1ODMyfQ.D4K-8vQPe5stRc4vbvPpK9mMQjqgZh58noQYq9g644Q' \
  -H 'origin: https://portfolio-law.hazelgrouse.pl' \
  -H 'priority: u=1, i' \
  -H 'referer: https://portfolio-law.hazelgrouse.pl/contact' \
  -H 'sec-ch-ua: "Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36' \
  --data-raw '{"name":"Mateusz Sadło","email":"sadlo.mateusz@gmail.com","message":"Temat: Wniosek egzekucyjny\n\nqwe","businessId":"portfolio-law","turnstileToken":null}' return : {
  "error": "Failed to send message"
  }
* 
