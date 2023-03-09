import { spawn, SpawnOptionsWithoutStdio } from 'child_process';

export const git = {
  committerUsername: process.env.GITHUB_USERNAME,
  committerEmail: process.env.GITHUB_EMAIL,
  repository: process.env.GITHUB_REPOSITORY,
  serverUrl: process.env.GITHUB_SERVER_URL,
  token: process.env.GITHUB_TOKEN,
};

export const execute = (cmd: string, args: string[] = [], options: SpawnOptionsWithoutStdio = {}) =>
  new Promise((resolve, reject) => {
    let outputData = '';
    let errorData = '';
    const optionsToCLI = {
      ...options,
    };
    if (!optionsToCLI.stdio) {
      Object.assign(optionsToCLI, { stdio: ['pipe', 'pipe', 'pipe'] });
    }
    const app = spawn(cmd, args, optionsToCLI);
    if (app.stdout) {
      // Only needed for pipes
      app.stdout.on('data', function (data) {
        outputData += data.toString();
      });
    }

    // show command errors
    if (app.stderr) {
      app.stderr.on('data', function (data) {
        errorData += data.toString();
      });
    }

    app.on('close', (code) => {
      const responseObj = { command: cmd + ' ' + args.join(' '), exitCode: code, outputData, errorData };
      if (code !== 0) {
        return reject(responseObj);
      }
      return resolve(responseObj);
    });
  });
