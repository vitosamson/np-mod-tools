export type UserReport = [string, number];
export type ModReport = [string, string];

export interface ThingData {
  user_reports: UserReport[];
  user_reports_dismissed?: UserReport[];
  mod_reports: ModReport[];
  mod_reports_dismissed?: ModReport[];
  ignore_reports: boolean;
}

export interface SlackMessage {
  text: string;
  user: string;
  ts: string;
  bot_profile?: {
    name: string;
  };
}
