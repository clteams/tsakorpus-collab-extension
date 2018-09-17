# Introduction
The [CollabEdit](https://github.com/prodotiscus/tsakorpus-collab-extension "CollabEdit extension") (third-party) extension is a wiki-tool for [Tsakorpus](https://bitbucket.org/tsakorpus/tsakonian_corpus_platform "Tsakorpus") platform:
  - enables making instant annotation edits on query results
  - edits on query results are inserted as **diff**-objects into the database
  - editors are being authorized and they take logins
  - thus, all edits on a single document may be represented as cascade sequence of diffs
  - every diff-object is referred to the matching user account

# Installation
## Clone the repository
First, you should clone the repo into your local machine, e.g.:

```bash
$ cd /home/my_user
$ git clone https://github.com/prodotiscus/tsakorpus-collab-extension collab
```

## Install files into Tsakorpus folder

After that, change your directory to the root directory of Tsakorpus (`/var/www/tsakorpus` here):

```bash
$ cd /var/www/tsakorpus
```

```bash
$ cd search/web_app
```

Then front-end content should be installed into `static` folder:

```bash
$ cp /home/my_user/collab/web-framework static/collab-extension
```

Server-side code is installed into current (i.e. `/var/www/tsakorpus/search/web_app`) folder directly:

```bash
$ cp -r /home/my_user/collab .
```

## Edit \_\_init\_\_.py

Open `__init__.py` file (do it like `vim __init__.py`) and put this string into the bottom of import statements:
```python3
from .collab import *
```

And another string into the bottom of the whole file:
```python3
flask_routes.make_routes(app)
```

## Restart the server
In case of using Apache server, restarting is needed for the previous changes to be applied: `service apache2 restart`.

## Configuration

Parameters (`corpusName` etc.) may be configured within `collab.js` file:
```bash
$ cd static/collab-extension
$ vim collab.js
```

## Permission errors

Possible permission errors related to Apache rw access can be resolved by editing Apache configuration files (in case of using Apache) as well as by using `chmod` and `chown` instructions.

# License

CollabEdit extension is distributed under the terms of Apache 2.0 License (see `LICENSE`).
