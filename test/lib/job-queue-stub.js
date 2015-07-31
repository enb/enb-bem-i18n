var JobQueueStub = require('mock-enb/lib/job-queue-stub');

// Usage of mock-fs does not allow to require XJST processor in runtime mode
// https://github.com/tschaub/mock-fs/issues/12
// So it needs to be required before mock-fs
JobQueueStub.prototype.processor = require('enb-xjst/lib/xjst-processor');
