# Crowdin Client

[![npm version](https://badge.fury.io/js/crowdin-client.svg)](https://www.npmjs.com/package/crowdin-client)
[![Build Status](https://travis-ci.org/4u/crowdin-client.svg?branch=master)](https://travis-ci.org/4u/crowdin-client)

Subset of Crowdin HTTP API.

## Upload branched translations
```js
import Crowdin from 'crowdin-client';

const crowdin = new Crowdin({
  accountKey: 'YOUR_KEY',
  login: 'YOUR_USERNAME',
  project: 'YOUR_PROJECT',
});

const promise = crowdin.createOrUpdateVersionedFile(
  'master',
  'my_project.pot',
  '/path/to/my_project.pot',
  'template/for/generated/po/%two_letters_code%.po',
);
```

## Download branched translations
```js
import Crowdin from 'crowdin-client';

const crowdin = new Crowdin({
  accountKey: 'YOUR_KEY',
  login: 'YOUR_USERNAME',
  project: 'YOUR_PROJECT',
});

crowdin.downloadTranslations('all', 'master').then(buffer => {
  // there is your buffer with zipped translations
});
```
