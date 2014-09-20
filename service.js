var util = require('util');
var bleno = require('bleno');
var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;
//var version = 2;

var oldValue = null;
var newValue = null;

var NotifyChar = function() {
  NotifyChar.super_.call(this, {
    uuid: '00000000000000000000000000000009',
    properties: ['notify'],
    onSubscribe: function(maxValueSize, updateValueCallback) {
      console.log('NotifyChar onSubscribe');
      if (oldValue == null) {
	oldValue = newValue;
      };
      setInterval(function() {
         if (oldValue != newValue) {
           oldValue = newValue;
           console.log('NotifyChar subscribe response ' + newValue.toString('utf-8'));
           updateValueCallback(new Buffer(newValue));
         };
      }, 2000);
    }
  });
};
util.inherits(NotifyChar, BlenoCharacteristic);

var RWChar = function() {
  RWChar.super_.call(this, {
    uuid: '00000000000000000000000000000003',
    properties: ['read', 'write', 'writeWithoutResponse']
  });
};

util.inherits(RWChar, BlenoCharacteristic);

RWChar.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  console.log('RWChar write request: ' + data.toString('utf8') + ' ' + offset + ' ' + withoutResponse);
  this.value = data;
  newValue = data;
  callback(this.RESULT_SUCCESS);
};

RWChar.prototype.onReadRequest = function(offset, callback) {
  var result = this.RESULT_SUCCESS;
  if (!this.value) {
    this.value = new Buffer('First value');
  };
  console.log('RWChar read request: ' + this.value.toString('utf8'));
  callback(result, this.value);
};

function SampleService1() {
  SampleService1.super_.call(this, {
    uuid: 'affffffffffffffffffffffffffffff6',
    characteristics: [
      new RWChar(),
      new NotifyChar()
    ]
  });
}

util.inherits(SampleService1, BlenoPrimaryService);

var ManuNameCharacteristic = function() {
  ManuNameCharacteristic.super_.call(this, {
    uuid: '00002A2900001000800000805f9b34fb',
    value: new Buffer('IAMMANUFACTNAME'),
    properties: ['read']
  });
};
util.inherits(ManuNameCharacteristic, BlenoCharacteristic);

function SampleService2() {
  SampleService2.super_.call(this, {
    uuid: 'bffffffffffffffffffffffffffffff6',
    characteristics: [
      new ManuNameCharacteristic()
    ]
  });
}
util.inherits(SampleService2, BlenoPrimaryService);



bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('BLUEY', ['affffffffffffffffffffffffffffff6'/*,'bffffffffffffffffffffffffffffff6'*/]);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function() {
  console.log('on -> advertisingStart');

  bleno.setServices([
    new SampleService1(),
    new SampleService2()
  ]);
});

bleno.on('advertisingStop', function() {
  console.log('on -> advertisingStop');
});

bleno.on('servicesSet', function() {
  console.log('on -> servicesSet');
});
