package com.myplunt.common.logging;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.filter.Filter;
import ch.qos.logback.core.spi.FilterReply;

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
