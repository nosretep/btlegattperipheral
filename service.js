var bleno = require('bleno');
var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

var oldValue = null;
var newValue = null;

var notifyChar = new BlenoCharacteristic({
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

var rwChar = new BlenoCharacteristic({
    uuid: '00000000000000000000000000000003',
    properties: ['read', 'write', 'writeWithoutResponse'],
    onReadRequest: function(offset, callback) {
      var result = this.RESULT_SUCCESS;
      if (!this.value) {
        this.value = new Buffer('First value');
      };
      console.log('RWChar read request: ' + this.value.toString('utf8'));
      callback(result, this.value);
    },
    onWriteRequest: function(data, offset, withoutResponse, callback) {
      console.log('RWChar write request: ' + data.toString('utf8') + ' ' + offset + ' ' + withoutResponse);
      this.value = data;
      newValue = data;
      callback(this.RESULT_SUCCESS);
    }
});

var manuNameCharacteristic = new BlenoCharacteristic({
  uuid: '00002A2900001000800000805f9b34fb',
  value: new Buffer('IAMMANUFACTNAME'),
  properties: ['read']
});

var sampleService1 = new BlenoPrimaryService({
  uuid: 'affffffffffffffffffffffffffffff6',
  characteristics: [ rwChar, notifyChar ]
});

var sampleService2 = new BlenoPrimaryService({
  uuid: 'bffffffffffffffffffffffffffffff6',
  characteristics: [ manuNameCharacteristic ]
});

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);
  if (state === 'poweredOn') {
    bleno.startAdvertising('BLUEY', ['affffffffffffffffffffffffffffff6']);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function() {
  console.log('on -> advertisingStart');
  bleno.setServices([ sampleService2, sampleService1 ]);
});

bleno.on('advertisingStop', function() {
  console.log('on -> advertisingStop');
});

bleno.on('servicesSet', function() {
  console.log('on -> servicesSet');
});
