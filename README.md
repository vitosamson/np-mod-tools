# NP Mod Tools

This browser extension adds some additional utilities for /r/NeutralPolitics mods

## Features

### Submission tools

#### Approve button
The approve button will approve the post, remove any flair and update the Slack thread. Optionally it will post the reminder sticky comment (on by default).

#### RFE button
The RFE button will simply add the `RFE` flair to the post and update the Slack thread.

TODO: maybe present the rules here as well, to specify what the RFE is for?

#### Reject button
The reject button will present the mod with a list of submission rules for the sub. Once the appropriate rules are selected, the post will be flaired and Slack updated.

#### Slack button
Shows the responses in the Slack thread for the submission and allows you to quickly send a new response.

## Permissions
The first time the extension runs, it'll ask you to give it a number of permissions on your reddit account. Here's what each permission is needed for:

  - **Submit links and comments from my account** - for posting the stickied reminder comment after a post is approved
  - **Access my inbox and send private messages to other users** - for reading and responding to the old modmail
  - **Access and manage modmail via mod.reddit.com** - for reading and responding to the new modmail
  - **Manage and assign flair in subreddits I moderate** - for flairing the post on approval/rejection/RFE
  - **Approve, remove, mark nsfw, and distinguish content in subreddits I moderate** - for distinguishing and stickying the reminder comment after approval
  - **Read wiki pages through my account** - for accessing comment templates from the wiki
  - **Maintain this access indefinitely (or until manually revoked)** - so the extension doesn't have to ask you for permission every time it wants to do something

## Assumptions

The extension makes a number of assumptions which makes it pretty much useful only on /r/NeutralPolitics.

  - the NeutralverseBot needs to be working in order to pick up the Slack thread link from the submission page
  - the rules on /about/rules need to be present
  - the sticky approval comment needs to be available at /wiki/submission_sticky

## Building

First install dependencies via `yarn install` (or `npm install`)

### Production
`./build-extension` will produce a .zip file for each browser.

### Development
`NODE_ENV=development webpack --watch`

In Chrome go to `chrome://extensions`, click "Load unpacked extension..." and select the `extension` directory in this repo.
