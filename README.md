# Introduction
The [CollabEdit](https://github.com/prodotiscus/tsakorpus-collab-extension "CollabEdit extension") (third-party) extension is a wiki-tool for [Tsakorpus](https://bitbucket.org/tsakorpus/tsakonian_corpus_platform "Tsakorpus") platform:
  - enables making instant annotation edits on query results
  - edits on query results are inserted as **diff**-objects into the database
  - editors are being authorized and they take logins
  - thus all edits on a single document may be represented as cascade sequence of diffs
  - all diffs are referred to the matching user account
