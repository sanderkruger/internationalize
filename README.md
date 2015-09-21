# internationalize

Light-weight plug-in for internationalization, working both for web and mobile apps.

Internationalize loads and substitutes language-specific phrases in the DOM in the browser.

It loosely follows the logic of mustache, distinguishing between double and triple parentheses to allow both plain text and HTML insertion.

## How it works

Include jquery.internationalize.js in your HTML page. When internationalize() is called on the document, it first clears all the placeholders and replaces them with attributes on their enclosing tags. Then, when the language file is available, it will insert the language in the tags.

The enclosing code can react to events to make the contents available only after the language has been chosen and substituted.

## Usage

In its simplest form, the language is known on loading the page. In the ready handler, create the language object.

    $(document).ready(function() {
        $(document).internationalize({
            langPath: 'dist/lang',
            language: 'en',
            onUpdate: function() {
                $('.content').show();
            }
        });
    });

This code sets the relative path to retrieve the language files. The language files must be json files named {lang}.json. In our example, there must be a file called dist/lang/en.json.

The onUpdate handler is called when the language is loaded, initialized and the DOM is updated.

## Language files

Language files contain nested groups of phrases. Phrases can be parameterized. The following is an example of a language file:

    {
        "user" : {
            "WELCOME" : "Welcome to {0}",
            "QUESTION" : "Are you looking for someone?",
            "ERROR_NAME" : "User {0} could not be found"
        },
        "index" : {
            "WELCOME" : "Welcome to HelloWorld",
            "EXPLAIN" : "To use this service, log in. Enter your username and password:",
            "GO" : "Go",
        }
    }

## Referencing phrases in HTML

An HTML snippet referencing the language would look like:

    <body>
        <h1>{{lang.user.WELCOME, SITE_NAME}}</h1>
        <p>{{lang.user.QUESTION}}</p>
        <input type="text" name="target" />
    </body>

Calling internationalize will replace the code and insert a <span> for the placeholder 'SITE_NAME'. The JS application can fill this in when this data becomes available:

    $('span#SITE_NAME').text('My HelloWorld');

## Referencing phrases in JavaScript

Placeholders can also be populated when being used in JS. The following snippet shows how a parameterized phrase is used in a notification:

    function submitSearch() {
        var target = $('[name=target]').val();
        $.ajax({
            url: 'finduser.php',
            data: {'target': target},
            dataType: 'json'})
        .done(function(json) {
            if (json.status == 'notfound') {
                var lang = $(document).data('lang');
                alert(lang.get('user.ERROR_NAME', target));
            }
        });
    }

In the above example, the value in the input field 'target' is sent to the server. If the server returns the status 'notfound', the language object is retrieved and the ERROR_NAME phrase is loaded with the entered name (target) as parameter.

