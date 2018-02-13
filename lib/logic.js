
/**
 * A shipment has been received by a recipient
 * @param {org.kit.blockchain.ShipmentReceived} shipmentReceived - the ShipmentReceived transaction
 * @transaction
 */
function shipmentReceived(shipmentReceived) {

    var contract = shipmentReceived.shipment.contract;
    var shipment = shipmentReceived.shipment;
    console.log('Received at: ' + shipmentReceived.timestamp);
    console.log('Contract arrivalDateTime: ' + contract.arrivalDateTime);

    // set the status of the shipment
    shipment.status = 'ARRIVED';

    return getAssetRegistry('org.kit.blockchain.Shipment')
        .then(function (shipmentRegistry) {
            // update the state of the shipment
            return shipmentRegistry.update(shipment);
        });
}

/**
 * An exception message has been received for a shipment
 * @param {org.kit.blockchain.ShipmentException} shipmentException - the ShipmentException transaction
 * @transaction
 */
function shipmentException(shipmentException) {
    var shipment = shipmentException.shipment;

    if (shipment.status == 'ARRIVED') {
        //an already arrived shipment can't add any new exceptions
        throw new Error('Shipment already arrived. There are no further Updates allowed.');
    } else {
        var factory = getFactory();

        console.log('Receiving new Message vom Shipment' + shipment.$identifier + ': ' + shipmentException.message);

        if (shipment.shipmentExceptions) {
            shipment.shipmentExceptions.push(shipmentException);
        } else {
            shipment.shipmentExceptions = [shipmentException];
        }

        return getAssetRegistry('org.kit.blockchain.Shipment').then(function (shipmentRegistry) {
            // add the message to the shipment      
            var newShipment = shipmentRegistry.update(shipment);
            var shipmentEvent = factory.newEvent('org.kit.blockchain', 'ShipmentExceptionEvent');
            shipmentEvent.message = shipmentException.message;
            shipmentEvent.gpsLat = shipmentException.gpsLat;
            shipmentEvent.gpsLong = shipmentException.gpsLong;
            shipmentEvent.shipmentId = shipment.shipmentId;
            emit(shipmentEvent);

            return newShipment
        });
    }
}

/**
 * The Shipment gets released from one shipper to another.
 * @param {org.kit.blockchain.ShipmentRelease} shipmentRelease - the ShipmentRelease transaction
 * @transaction
 */
function shipmentRelease(shipmentRelease) {
    var contract = shipmentRelease.shipment.contract;
    var shipment = shipmentRelease.shipment;
    var shipper_old = shipmentRelease.shipper_old;
    var shipper_new = shipmentRelease.shipper_new;
    if (shipment.status != 'CREATED' && shipment.status != 'IN_TRANSIT') {
        throw new Error('Shipments can only be released when Status is CREATED or IN_TRANSIT.');
    } else {
        //check if the shipment is being relased by the current shipper
        if (shipper_old == contract.shippers[contract.shippers.length - 1]) {
            shipment.status = 'RELEASED';
            var factory = getFactory();

            return getAssetRegistry('org.kit.blockchain.Shipment').then(function (shipmentRegistry) {
                // add the release to the shipment      
                var newShipment = shipmentRegistry.update(shipment);
                var shipmentEvent = factory.newEvent('org.kit.blockchain', 'ShipmentReleaseEvent');
                shipmentEvent.shipper_old = shipper_old;
                shipmentEvent.shipper_new = shipper_new;
                shipmentEvent.shipmentId = shipment.shipmentId;
                emit(shipmentEvent);

                return newShipment
            });
        } else {
            throw new Error('Only the current shipper can release a Shipment.');
        }
    }
}

/**
 * The Shipment gets overtaken from the current shipper.
 * @param {org.kit.blockchain.ShipmentOvertake} shipmentOvertake - the ShipmentOvertake transaction
 * @transaction
 */
function shipmentOvertake(shipmentOvertake) {
    var contract = shipmentOvertake.shipment.contract;
    var shipment = shipmentOvertake.shipment;
    var shipper_old = shipmentOvertake.shipper_old;
    var shipper_new = shipmentOvertake.shipper_new;

    if (shipment.status != 'RELEASED') {
        throw new Error('Shipments can only be overtaken when status is RELEASED.');
    } else {
        shipment.status = 'IN_TRANSIT';
        //add the new shipper to the shippers list of the current shipment
        contract.shippers.push(shipper_new);

        var factory = getFactory();
        return getAssetRegistry('org.kit.blockchain.Contract').then(function (contractRegistry) {
            // update the shippers list
            return contractRegistry.update(contract);
        })
            .then(function () {
                return getAssetRegistry('org.kit.blockchain.Shipment').then(function (shipmentRegistry) {
                    // add the overtake to the shipment      
                    var newShipment = shipmentRegistry.update(shipment);
                    var shipmentEvent = factory.newEvent('org.kit.blockchain', 'ShipmentOvertakeEvent');
                    shipmentEvent.shipper_old = shipper_old;
                    shipmentEvent.shipper_new = shipper_new;
                    shipmentEvent.shipmentId = shipment.shipmentId;
                    emit(shipmentEvent);

                    return newShipment
                })
            })
    }
}

/**
 * Initialize some test assets and participants useful for running a demo.
 * @param {org.kit.blockchain.SetupDemo} setupDemo - the SetupDemo transaction
 * @transaction
 */
function setupDemo(setupDemo) {

    var factory = getFactory();
    var NS = 'org.kit.blockchain';

    // create dispatchers
    var dispatcher1 = factory.newResource(NS, 'Dispatcher', 'oem1@email.com');
    var dispatcher1Address = factory.newConcept(NS, 'Address');
    dispatcher1Address.country = 'USA';
    dispatcher1.address = dispatcher1Address;

    var dispatcher2 = factory.newResource(NS, 'Dispatcher', 'foxconn@email.com');
    var dispatcher2Address = factory.newConcept(NS, 'Address');
    dispatcher2Address.country = 'China';
    dispatcher2.address = dispatcher2Address;

    // create recipients
    var recipient = factory.newResource(NS, 'Recipient', 'mediamars@email.com');
    var recipientAddress = factory.newConcept(NS, 'Address');
    recipientAddress.country = 'UK';
    recipient.address = recipientAddress;

    var recipient2 = factory.newResource(NS, 'Recipient', 'expert@email.com');
    var recipient2Address = factory.newConcept(NS, 'Address');
    recipient2Address.country = 'Germany';
    recipient2.address = recipient2Address;

    // create shippers
    var shipper = factory.newResource(NS, 'Shipper', 'ship2u@email.com');
    var shipperAddress = factory.newConcept(NS, 'Address');
    shipperAddress.country = 'Panama';
    shipper.address = shipperAddress;

    var shipper2 = factory.newResource(NS, 'Shipper', 'dhl@email.com');
    var shipper2Address = factory.newConcept(NS, 'Address');
    shipper2Address.country = 'Germany';
    shipper2.address = shipper2Address;

    var shipper3 = factory.newResource(NS, 'Shipper', 'ups@email.com');
    var shipper3Address = factory.newConcept(NS, 'Address');
    shipper3Address.country = 'USA';
    shipper3.address = shipper3Address;

    var shipper4 = factory.newResource(NS, 'Shipper', 'fedex@email.com');
    var shipper4Address = factory.newConcept(NS, 'Address');
    shipper4Address.country = 'Australia';
    shipper4.address = shipper4Address;

    //create insurer
    var insurer = factory.newResource(NS, 'Insurer', 'allianz@email.com');
    var insurerAddress = factory.newConcept(NS, 'Address');
    insurerAddress.country = 'Germany';
    insurer.address = insurerAddress;

    //create devices
    var device1 = factory.newResource(NS, 'Device', 'Container-1');
    var device1Address = factory.newConcept(NS, 'Address');
    device1Address.country = 'Germany';
    device1.address = device1Address;

    var device2 = factory.newResource(NS, 'Device', 'Container-2');
    var device2Address = factory.newConcept(NS, 'Address');
    device2Address.country = 'England';
    device2.address = device2Address;


    // create a contract
    var contract = factory.newResource(NS, 'Contract', 'con1');
    contract.dispatcher = factory.newRelationship(NS, 'Dispatcher', 'oem1@email.com');
    contract.recipient = factory.newRelationship(NS, 'Recipient', 'mediamars@email.com');
    contract.shippers = [factory.newRelationship(NS, 'Shipper', 'ship2u@email.com')];
    var tomorrow = setupDemo.timestamp;
    tomorrow.setDate(tomorrow.getDate() + 1);
    contract.arrivalDateTime = tomorrow; // the shipment has to arrive tomorrow

    var contract2 = factory.newResource(NS, 'Contract', 'con2');
    contract2.dispatcher = factory.newRelationship(NS, 'Dispatcher', 'foxconn@email.com');
    contract2.recipient = factory.newRelationship(NS, 'Recipient', 'expert@email.com');
    contract2.shippers = [factory.newRelationship(NS, 'Shipper', 'fedex@email.com')];
    var nextWeek = setupDemo.timestamp;
    nextWeek.setDate(nextWeek.getDate() + 7);
    contract2.arrivalDateTime = nextWeek; //shipment hast to arrive next week

    // create the shipments
    var shipment = factory.newResource(NS, 'Shipment', 'ship1');
    shipment.status = 'CREATED';
    shipment.contract = factory.newRelationship(NS, 'Contract', 'con1');
    shipment.insurer = factory.newRelationship(NS, 'Insurer', 'allianz@email.de');
    shipment.device = factory.newRelationship(NS, 'Device', 'Container-1');

    var shipment2 = factory.newResource(NS, 'Shipment', 'ship2');
    shipment2.status = 'IN_TRANSIT';
    shipment2.contract = factory.newRelationship(NS, 'Contract', 'con2');
    shipment2.insurer = factory.newRelationship(NS, 'Insurer', 'allianz@email.de');
    shipment2.device = factory.newRelationship(NS, 'Device', 'Container-2');

    //Update all entities
    return getParticipantRegistry(NS + '.Dispatcher')
        .then(function (dispatcherRegistry) {
            // add the dispatcher
            return dispatcherRegistry.addAll([dispatcher1, dispatcher2]);
        })
        .then(function () {
            return getParticipantRegistry(NS + '.Recipient');
        })
        .then(function (recipientRegistry) {
            // add the recipient
            return recipientRegistry.addAll([recipient, recipient2]);
        })
        .then(function () {
            return getParticipantRegistry(NS + '.Shipper');
        })
        .then(function (shipperRegistry) {
            // add the 1st shipper
            return shipperRegistry.addAll([shipper, shipper2, shipper3, shipper4]);
        })
        .then(function () {
            return getParticipantRegistry(NS + '.Device');
        })
        .then(function (deviceRegistry) {
            // add devices
            return deviceRegistry.addAll([device1, device2]);
        })
        .then(function () {
            return getParticipantRegistry(NS + '.Insurer');
        })
        .then(function (insurerRegistry) {
            // add insurer
            return insurerRegistry.addAll([insurer]);
        })
        .then(function () {
            return getAssetRegistry(NS + '.Contract');
        })
        .then(function (contractRegistry) {
            // add the contract
            return contractRegistry.addAll([contract, contract2]);
        })
        .then(function () {
            return getAssetRegistry(NS + '.Shipment');
        })
        .then(function (shipmentRegistry) {
            // add the shipments
            return shipmentRegistry.addAll([shipment, shipment2]);
        });
}