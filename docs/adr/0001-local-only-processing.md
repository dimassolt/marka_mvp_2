# Text never leaves the user's machine

Ghost Agent exists to stop sensitive data from reaching third-party services, so it must not send that data anywhere itself. All detection and rephrasing runs locally. This rules out cloud APIs, usage tracking and logging of user text, including debug logs. It is a hard rule and part of the pitch, so a cloud model is off the table even when it would be better or faster.
