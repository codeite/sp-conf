'strict mode'
/* global describe, it */

require('must/register')

const deepFreeze = require('../deepFreeze').deepFreeze
const deepClone = require('../deepFreeze').deepClone
const makeClonable = require('../deepFreeze').makeClonable
const makeClonableAndDeepFreeze = require('../deepFreeze').makeClonableAndDeepFreeze

describe('freezing', () => {
  describe('deepFreeze', () => {
    it('must freeze a given object', () => {
      const sampleObject = {
        first: 1,
        second: 'two'
      }

      Object.isFrozen(sampleObject).must.be.false()
      deepFreeze(sampleObject)

      Object.isFrozen(sampleObject).must.be.true()
      sampleObject.first = 'other'
      sampleObject.first.must.equal(1)
      sampleObject.second.must.equal('two')
    })

    it('must freeze a given objects object properties', () => {
      const sampleObject = {
        child: {
          cheese: true
        }
      }

      Object.isFrozen(sampleObject.child).must.be.false()
      deepFreeze(sampleObject)
      Object.isFrozen(sampleObject.child).must.be.true()
    })

    it('must freeze a given objects function properties', () => {
      const sampleObject = {
        child: {
          makeSandwitch: () => true
        }
      }

      Object.isFrozen(sampleObject.child.makeSandwitch).must.be.false()
      deepFreeze(sampleObject)
      Object.isFrozen(sampleObject.child.makeSandwitch).must.be.true()
    })
  })

  describe('deepClone', () => {
    it('must clone an object', () => {
      const sampleObject = {
        first: 1,
        second: 'two'
      }

      const clonedObject = deepClone(sampleObject)
      clonedObject.first = 99
      clonedObject.second = '99'

      sampleObject.first.must.equal(1)
      sampleObject.second.must.equal('two')
      clonedObject.first.must.equal(99)
      clonedObject.second.must.equal('99')
    })

    it('must clone sub objcts object', () => {
      const sampleObject = {
        subObject: {
          first: 1,
          second: 'two'
        },
        subObject2: {
          alpha: 'omega'
        }
      }

      const clonedObject = deepClone(sampleObject)
      clonedObject.subObject.first = 99
      clonedObject.subObject.second = '99'
      clonedObject.subObject2 = {}

      sampleObject.subObject.first.must.equal(1)
      sampleObject.subObject.second.must.equal('two')
      sampleObject.subObject2.alpha.must.equal('omega')

      clonedObject.subObject.first.must.equal(99)
      clonedObject.subObject.second.must.equal('99')
      clonedObject.subObject2.must.be.empty()
    })
  })

  describe('makeClonable', () => {
    it('must add a "cloneAndRefreeze" function to an object', () => {
      const sampleObject = {
        child: {
          cheese: true
        }
      }

      makeClonable(sampleObject)
      sampleObject.cloneAndRefreeze.must.be.a.function()
    })

    describe('calling cloneAndRefreeze', () => {
      it('should return an identical frozen clone when no args passed', () => {
        const sampleObject = {
          child: {
            cheese: true
          }
        }
        makeClonable(sampleObject)

        const clonedObject = sampleObject.cloneAndRefreeze()
        sampleObject.child.cheese = false

        Object.isFrozen(clonedObject).must.be.true()
        Object.isFrozen(clonedObject.child).must.be.true()
        clonedObject.child.cheese.must.be.true()
      })

      it('should return a frozen clone with selected modifications', () => {
        const sampleObject = {
          child: {
            cheese: true
          }
        }
        makeClonable(sampleObject)

        const clonedObject = sampleObject.cloneAndRefreeze(x => {
          x.wibble = 'wobble'
          x.child.cheese = false
        })

        Object.isFrozen(clonedObject).must.be.true()
        Object.isFrozen(clonedObject.child).must.be.true()

        sampleObject.must.not.have.property('wibble')
        clonedObject.wibble.must.equal('wobble')

        sampleObject.child.cheese.must.be.true()
        clonedObject.child.cheese.must.be.false()
      })
    })
  })

  describe('makeClonableAndDeepFreeze', () => {
    it('must add a "cloneAndRefreeze" function to an object and freeze it', () => {
      const sampleObject = {
        child: {
          cheese: true
        }
      }

      Object.isFrozen(sampleObject).must.be.false()
      makeClonableAndDeepFreeze(sampleObject)
      sampleObject.cloneAndRefreeze.must.be.a.function()
      Object.isFrozen(sampleObject).must.be.true()
    })
  })
})
