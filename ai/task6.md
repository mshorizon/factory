in root folder templates/portfolio-tech there is my business portfolio website

this website is available on url: https://portfolio-tech.hazelgrouse.pl/ and https://portfolio-tech.dev.hazelgrouse.pl/

major task is that: this website should looks like: https://xtract.framer.ai/ (design from figma: https://framer.com/projects/Xtract-Template-copy--94gKSiWjpv0d0YXOwU1j-9sPx9?duplicate=5ApegM5Tv2YIbYfJ918w&node=augiA20Il - use figma MCP to get what you need)

we use our engine to build ten template portfolio-tech and later i will use this template to insert my own data but you can use data from templates/portfolio-tech/portfolio-tech.json

before implement some component > check if we have this component already in engine and in packages/ui - if component is similar then implement this component variant if this in whole new compoentn > implement new component

colors spacing theme e.g. should be in bisiness json

website should be renderes from business json ofc - using our engine

if there is some image or video > download it and insert into our claudflare

implement other pages too like: About, Blog, Contact etc.

use playwright mcp to compare both websites - dont be conservative - create whole new variants if you need

i want new feature: that every business in business json > theme object have "major theme" field - now we have two major theme options "specialist" and "portfolio-tech" - change opction should be available in admin panel
after change option > every section change variants that website is consistant - then user can overwrite section variant in admin panel - every overwrite should be informed i nadmin panel need field of overwrite with button to revert to major theme variant