const LogMe = {
    doLog: (method, ...message) => {
        if (!process.env.DEBUG) {
            return;
        }
        console[method](...message);
    },
    log: (...message) => {
        LogMe.doLog('log', ...message);
    },
    warn: (...message) => {
        LogMe.doLog('warn', ...message);
    },
    error: (...message) => {
        LogMe.doLog('error', ...message);
    },
    debug: (...message) => {
        LogMe.doLog('debug', ...message);
    },
    dir: (...message) => {
        LogMe.doLog('dir', ...message);
    },
};

export default LogMe;