# internationalize
Light-weight plug-in for internationalization, working both for web and mobile apps.

Internationalize loads and substitutes language-specific phrases in the DOM in the browser.

It loosely follows the logic of mustache, distinguishing between double and triple parentheses to allow both plain text and HTML insertion.

## How it works
Include jquery.internationalize.js in your HTML page. When internationalize() is called on the document, it first clears all the placeholders and replaces them with attributes on their enclosing tags. Then, when the language file is available, it will insert the language in the tags.

The enclosing code can react to events to make the contents available only after the language has been chosen and substituted.
