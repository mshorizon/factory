do changes for portfolio-tech business template

every change is from https://xtract.framer.ai/ so firstly use playwright mcp to see it
design from figma: https://framer.com/projects/Xtract-Template-copy--2jBDoKmRD3LJtz6OjO2b-h1FtM?duplicate=5ApegM5Tv2YIbYfJ918w&node=augiA20Il

# Navbar
* height should be around 64px 
* font of links should be 14px or 12px (not 16px) - taken from theme json
* "Book a call" should have smaller rounding and should not have arrow. just like on section "Let AI do the Work so you can Scale Faster" but without arrow
* logo > for whole business find some other bird logo

# hero section
* height of hero section should be 100vh - 100% of viewport height - minus 100px
* CSS circles animation blur effect is 10x too strong
* for this template .font-bold class = 400 weight
* particle effect (white pixcels) - pixcels should start on edges of available space (available space = whole hero section background) and pixcels should fastly walk into center of hero section/center of CSS circles
* animation steps of this section:
  * step 1: 1 sec disply only css cirsle with white pixcels particle effect
  * step 2: after 1 sec reveal all content without text "AI Automation Agency" - duration 0,5sek
  * step3: after that reveal text "AI Automation Agency" duration: 0,5sek

# Over 50+ businesses trust us
* width of window where firms are available should be 1/4x larger
* animation should be 2x slower
* gap between firms should be 1/2x smaller

# badges like "Our Services", "Our Process" and so one
* every section have badge as first element - replace it!!!
* those badges should looks like badge: "Workflow Automation" inside "Our Services" section

# Our Services section
* images should be 350x300 px + padding (width lighter background): "50 50 0"
* for whote template "font-semibold" = 500 weight

# Our Process section
* replace section title badge
* cards should have max 440px width
* cards should be close to each other - 20px gap
  * dont use grid - use flex because first column have too large width - behind border
* badges like "Step 1":
  * should have 12px font size
  * padding of badge: "6px 9px"
* gap inside cards between badge and card title should be 2x smaller
* every step should have image under texts and should not have badged below step desctiotion. images sizes 360x160 - located just like on reference website

# Case Studies section
* carusel changes:
  * carusel should be smooth - if drag a little then move a little item insite carusel (now works that wen dragign nothing happen - but when draging a lot there is very big step in crausel)
  * now after drop - carusel should be centered to closed item
  * one item on the time is available after drop
* replace badge above this text

# Benefits section
* section header should be centered just like section "Case Studies"
* for every card:
  * gradient should be a little bit less visible

# Pricing section
* replace badge!!!

# Testimonials section
* section header title should be centered - just like section "Case Studies" doing it
* add new varinat of cards and style those like on reference website (image and person name within card and awesome gradient from left down corner), white stars not in cta color
  * implement whole new varint and use it in portfolio-tech template
* grid should have 2 kolumns not 3
* why i 3 times tell you to do above changes and you want want to?
* tell my why u dont want to add new variant - please describe me why 4 times u generated old variant for this business

# FAQ section
* center everything
* questions max width: 780px
* reoplace badge
* gradiet must be a little bit more visable

# overall
* scroll animation should be option in business json - now we have rought scroll i want as variant scroll like on reference website - smoth and after stop scrolling a little bit stoping delay
* portfolio-tech template should have this new scrollbar variant
* 3x i tell you that and nothing happens - i want now way of scrolling - more smooth

# footer
* text "Automate Smarter, Optimize Faster, and Grow Stronger." should be lighter
* max width of footer content should be the same as sections - just gradient should be from whole left to whole right
* logo icon should be taken from navbar (should be taken from the same place)
* remove pages or "Strony" column - column from specialist business templates should left
* for this footer viariant - bottom padding should be 2x smaller