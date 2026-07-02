task description:

add to package.json file script "bc-check" (backward compatibility-check). what this does is to for every template from templates folder:
* get prod website from "https://[template-name].hazelgrouse.pl/" (e.g. https://template-law.hazelgrouse.pl/) - with subpages that are available from navbar
* get develop wersion from "https://[template-name]-dev.hazelgrouse.pl/" (e.g. https://template-law-dev.hazelgrouse.pl/) - with subpages that are available from navbar
* compare them
* show results with score
* if compare metric is diferent that 100%: script say where is the difference (in which section)


Moreover add claude code skill that fix backward compatibility issues.

into folder features/bc-check you can add md files that will help to implement and develop this feature in the feature, files like README.md, CONTEXT.md, TODO.md etc 

Feature is required because in this repo there is websites factory based on templates and now i change one template and other template breaks. I want using one tool to check backward compatibility. second toll using claude - fix issues