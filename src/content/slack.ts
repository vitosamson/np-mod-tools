import { SlackMessage } from './types';
import { makeOauthCall } from './utils';

let _slackToken: string | null = null;
let _slackLink: string | null = null;
let _slackChannel: string | null = null;
let _slackThreadTs: string | null = null;

export const emojis = {
  approval: 'white_check_mark',
  rfe: 'rfe',
  rejection: 'x',
};

export async function getSlackToken(): Promise<string | null> {
  if (_slackToken) {
    return _slackToken;
  }

  const res = await makeOauthCall<{ data: { content_md: string } }>(
    'https://oauth.reddit.com/r/NeutralMods/wiki/accounts.json'
  );
  const match = res.data.content_md.match(/NeutralverseBot OAuth Access Token: (?<token>.*)\b/);
  _slackToken = match?.groups?.token || null;

  if (!_slackToken) {
    console.error('Could not get slack token');
  }

  return _slackToken;
}

export function getSlackThread() {
  if (_slackThreadTs && _slackChannel) {
    return {
      ts: _slackThreadTs,
      channel: _slackChannel,
      link: _slackLink,
    };
  }

  const linkEl: HTMLAnchorElement | null = document.querySelector(
    '.nestedlisting .comment[data-author="NeutralverseBot"] .usertext-body a[href*="slack.com/archives"]'
  );
  const link = linkEl?.href;

  if (!link) {
    throw new Error('The slack thread was not posted on this submission.');
  }

  const path = link.split('/');
  const id = path[path.length - 1].slice(1);
  _slackThreadTs = `${id.slice(0, -6)}.${id.slice(-6)}`;
  _slackChannel = path[path.length - 2];
  _slackLink = link;

  console.log('slack link:', link, 'ts:', _slackThreadTs, 'channel:', _slackChannel);

  return {
    link,
    ts: _slackThreadTs,
    channel: _slackChannel,
  };
}

async function createSlackRequest(apiAction: string, data: Record<string, unknown>) {
  const { ts, channel } = getSlackThread();
  const allData = {
    ...data,
    channel,
    // different api actions use different keys for the timestamp
    ts,
    timestamp: ts,
    thread_ts: ts,
    token: _slackToken,
  };

  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(allData)) {
    body.append(key, String(value));
  }

  const res = await fetch(`https://slack.com/api/${apiAction}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const json = await res.json();

  if (!json.ok) {
    console.error('Slack error', json);
    throw new Error(`Error in ${apiAction} slack request`);
  }

  return json;
}

export function postSlackThreadResponse(text: string) {
  return createSlackRequest('chat.postMessage', { text });
}

export function addSlackThreadEmoji(emoji: string) {
  return createSlackRequest('reactions.add', { name: emoji });
}

export function removeSlackThreadEmoji(emoji: string) {
  return createSlackRequest('reactions.remove', { name: emoji });
}

export async function getSlackUserName(userId: string): Promise<string> {
  const res = await createSlackRequest('users.info', { user: userId });

  return res.user.name;
}

export async function getSlackThreadReplies(): Promise<SlackMessage[]> {
  const { messages }: { messages: SlackMessage[] } = await createSlackRequest('conversations.replies', { limit: 100 });

  return Promise.all(
    messages
      .filter(message => !!(message.user || message.bot_profile))
      .map(async message => ({
        text: message.text,
        ts: message.ts,
        user: message.bot_profile ? message.bot_profile.name : await getSlackUserName(message.user),
      }))
  );
}

export function tsToDate(ts: string) {
  const jsTimestamp = parseInt(ts.split('.')[0]) * 1000;
  return new Date(jsTimestamp).toLocaleString();
}
