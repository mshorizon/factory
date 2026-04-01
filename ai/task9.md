do changes for portfolio-tech business template

every change is from https://xtract.framer.ai/ so firstly use playwright mcp to see it
design from figma: https://framer.com/projects/Xtract-Template-copy--2jBDoKmRD3LJtz6OjO2b-h1FtM?duplicate=5ApegM5Tv2YIbYfJ918w&node=augiA20Il

# navbar
* font of links should be 14px or 12px not 16px - taken from theme json
* for this business template height of navbar should be 1/3 smaler
* "Book a call" should have smaller rounding and should not have arrow just like on section "Let AI do the Work so you can Scale Faster" but without arrow
* logo > for whole business find some other bird logo

# hero section
* implement CSS animation - reference on website, i copy for you element what we need: <div class="framer-v5tokv" data-framer-name="BG"><div class="framer-q5ecxp" data-framer-name="Big Circle" style="will-change: transform; opacity: 1; transform: rotate(-72.468deg);"></div><div class="framer-1mwerlq" data-framer-name="Small circle" style="will-change: transform; opacity: 1; transform: translate(-50%, -50%) rotate(241.44deg);"></div></div>
* add particle efect as on reference website
* "New AI Automation Agency"
  * on first stage of animation padding right is 2px then 10px
* "Intelligent Automation for Modern Businesses" should have 400 weight - all those kind of typography for this template should have 400weight
* "Get in touch" button should be smaller
* "View services" button should be smaller
* animation description:
  * use the same as in figma / referece website
  * after open website there should be only this awesome css animation
  * then after 2 sec from translarent and blury (not from down like now) - apear texts of hero page - from first word to last world aniamtion, and in this time apear navbar

# Over 50+ businesses trust us
* animation should be 2x slower
* gap between firms should be 2x smaller
* whole section padding top and bottom should be 2x smaller
* margin under "Over 50+ businesses trust us" should be 1/3 smaller or something around that
* firms should disapear on the dark and be visible from the dark - use gradient on left and right side

# badges like "Our Services", "Our Process" and so one
* those badges should looks like badge: "Workflow Automation" 

# Our Services section
* "AI Solutions That Take Your Business to the Next Level" text should have max 700px width
* images in this section should be max 350x300 px
* remove badge: "100+ Automations"
* gap between image and text should be around 80px
* gap between rows should be around 100px
* while scrolling animate whole row because now firstly image in vosible then text

# Our Process section
* badges like "Step 1" have too large width - should have small width - as large as content need not full parent width
* every step should have image under texts and should not have badged below step desctiotion. images sizes 360x160 - located just like on reference website
* rounding of cards should be smaller
* Our Simple, Smart, and Scalable Process - max 700 width - do this for similar texts

# Case Studies section
* after last changes there is no carusel here - if i drag and drop nothing changes then whole item is replaced - this is wrong. when draging whole item should go e.g. left and from right there should be rolling another item. what io ment last time was i dont want stop at center of items - when stop draging there should be scroll to closes item to display whole item at once
  * draging on arrows click works awesome - i want the same behaviour when draging
* there should be dark gradient from right too (left gradient already exists)
* images should have small rounding
* dots neer e.g. "40% Less Inventory Waste" should not be in cta color > just main text color > in this case white
* gap between image and text should be around 60px
* font of title e.g. "FinSolve - Operations Automation" should be thicker and larger
* gap between Drag to explore and items should be larger

# Benefits section
* section header should be centered just like section "Case Studies"
* for every card:
  * content is centered > should be allign to left
  * icons should be 1 level smaller
  * titles like Increased Productivity should be larger and thicker

# Pricing section
* switch Monthly/Annually should be as default checked
* for every card in pricing:
  * texts like "Starter" should be thicker and larger
* buttons "Choose this plan" and "Schedule a call" should be on the same height/row - now Choose this plan is a little bit lower

# Testimonials section
* stilll you doesnt do anythink with testimonials - we need whole new variant with styles from referenced website
* texts "Testimonials
  Why Businesses Love Our AI Solutions
  Real businesses, real results with AI automation." should be centered - just like section "Case Studies" doing it
* add new varinat of cards and style those like on reference website (image and person name within card and awesome gradient from left down corner), white stars not in cta color
  * implement whole new varint and use it in portfolio-tech template
* grid should have 2 kolumns not 3

# FAQ section
* add varinat of FAQ questions and style those like in reference website
  * gradiennt should be one for all question in background
  * questions should have border on every side like on reference website
* use this variant in portfolio-tech template

# overall
* scroll animation should be option in business json - now we have rought scroll i want as variant scroll like on reference website - smoth and after stop scrolling a little bit stoping delay
* portfolio-tech template should have this new scrollbar variant

# Let AI do the Work so you can Scale Faster
* all good

# footer
* max width of footer content should be the same as sections - just gradient should be from whole left to whole right
* logo icon should be taken from navbar (should be taken from the same place)
* remove pages or "Strony" column - column from specialist business templates should left
* for this footer viariant - bottom padding should be 2x smaller