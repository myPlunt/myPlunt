package com.myplunt.common.logging;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.filter.Filter;
import ch.qos.logback.core.spi.FilterReply;

// Decides which lines reach the logs table (wired up in DatabaseLogging): warnings and errors
// from anywhere, and INFO only from our own code, which is where user actions are logged.
// Spring's and Hibernate's INFO lines stay on the console.
public class LogTableFilter extends Filter<ILoggingEvent> {

    @Override
    public FilterReply decide(ILoggingEvent event) {
        Level level = event.getLevel();
        if (level.isGreaterOrEqual(Level.WARN)) {
            return FilterReply.NEUTRAL;
        }
        if (level.isGreaterOrEqual(Level.INFO) && event.getLoggerName().startsWith("com.myplunt.")) {
            return FilterReply.NEUTRAL;
        }
        return FilterReply.DENY;
    }
}
