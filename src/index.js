const unitTypes = require('./Classes/unit-types.json');

const unitConversions = {
  quantity: [],
  weight: [{ start: 'metric', end: 'imperial', factor: 28.3495 }],
  volume: [{ start: 'metric', end: 'imperial', factor: 4.9289 }],
  length: [{ start: 'metric', end: 'imperial', factor: 2.54 }]
};

class Unit {
  constructor(value) {
    this.value = value;
    this.text = value;
    this.baseUnit = false;
    this.system = null;
    this.conversion = null;
    this.unitType = null;
    this.create(value);
  }

  create(unit) {
    for (const unitType of Object.keys(unitTypes)) {
      const unitTypeObj = unitTypes[unitType];
      const unitObj = unitTypeObj.find(ut => ut.value === unit);

      if (unitObj) {
        this.unitType = unitType;
        this.text = unitObj.text;
        this.system = unitObj.system;
        this.conversion = unitObj.conversion || null;
        this.baseUnit = unitObj.baseUnit || false;
        break;
      }
    }
  }

  convertToBase(type, value) {
    if (this.baseUnit) return value;

    if (type === 'cost') return value / this.conversion;
    if (type === 'quantity') return value * this.conversion;
    return value;
  }

  convertFromBase(type, value, round = false) {
    if (this.baseUnit) return round ? parseFloat(value).toFixed(2) : value;

    if (type === 'cost') {
      let newValue = value * this.conversion;
      return round ? parseFloat(newValue).toFixed(2) : newValue;
    }
    if (type === 'quantity') {
      let newValue = value / this.conversion;
      return round ? parseFloat(newValue).toFixed(2) : newValue;
    }
    return round ? parseFloat(value).toFixed(2) : value;
  }

  getBaseUnit() {
    const unitTypeObj = unitTypes[this.unitType];
    const baseUnitObj = unitTypeObj.find(ut => ut.system === this.system && ut.baseUnit);
    return baseUnitObj.value;
  }
}

class UnitConverter {
  constructor(oldUnit, newUnit) {
    this.oldUnit = new Unit(oldUnit);
    this.newUnit = new Unit(newUnit);
  }

  convert(type, value) {
    if (this.oldUnit.unitType !== this.newUnit.unitType) {
      console.error(
        `Cannot convert from ${this.oldUnit.unitType}:${this.oldUnit.text} to ${this.newUnit.unitType}:${this.newUnit.text}`
      );
      return value;
    }

    value = parseFloat(value);

    if (value === 0) return value;

    if (this.oldUnit.system === this.newUnit.system) {
      return this.newUnit.convertFromBase(type, this.oldUnit.convertToBase(type, value));
    } else {
      const conversions = unitConversions[this.oldUnit.unitType];
      const oldBaseVal = this.oldUnit.convertToBase(type, value);
      let newBaseVal = 0;

      for (const conversion of conversions) {
        if (conversion.start === this.oldUnit.system) {
          if (type === 'cost') newBaseVal = oldBaseVal * conversion.factor;
          if (type === 'quantity') newBaseVal = oldBaseVal / conversion.factor;
          break;
        } else if (conversion.end === this.oldUnit.system) {
          if (type === 'cost') newBaseVal = oldBaseVal / conversion.factor;
          if (type === 'quantity') newBaseVal = oldBaseVal * conversion.factor;
          break;
        }
      }

      return this.newUnit.convertFromBase(type, newBaseVal);
    }
  }

  convertCost(value) {
    return this.convert('cost', value);
  }

  convertQuantity(value) {
    return this.convert('quantity', value);
  }
}

module.exports = {
  Unit: Unit,
  UnitConverter: UnitConverter,
};
