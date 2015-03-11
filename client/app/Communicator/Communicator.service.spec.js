'use strict';

describe('Service: Communicator', function () {

  // load the service's module
  beforeEach(module('jRoomsApp'));

  // instantiate service
  var Communicator;
  beforeEach(inject(function (_Communicator_) {
    Communicator = _Communicator_;
  }));

  it('should do something', function () {
    expect(!!Communicator).toBe(true);
  });

});
