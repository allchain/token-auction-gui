import { Mongo } from 'meteor/mongo';

const Tokens = new Meteor.Collection(null)

Session.set('buying', localStorage.getItem('buying') || 'ETH')
Session.set('selling', localStorage.getItem('selling') || 'MKR')

/**
 * Syncs the buying and base selling' balances and allowances of selected account,
 * usually called for each new block
 */
Tokens.sync = function () {
  var network = Session.get('network')
  var address = Session.get('address')
  if (address) {
    web3.eth.getBalance(address, function (error, balance) {
      var newETHBalance = balance.toString(10)
      if (!error && !Session.equals('ETHBalance', newETHBalance)) {
        Session.set('ETHBalance', newETHBalance)
      }
    })

    var ALL_TOKENS = _.uniq([ Session.get('buying'), Session.get('selling') ])

    if (network !== 'private') {
      var contract_address = TokenAuction.objects.auction.address

      // Sync token balances and allowances asynchronously
      ALL_TOKENS.forEach(function (token_id) {
        // XXX EIP20
        Dapple.getToken(token_id, function (error, token) {
          if (!error) {
            token.balanceOf(address, function (error, balance) {
              if (!error) {
                Tokens.upsert(token_id, { $set: { balance: balance.toString(10) } })
              }
            })
            token.allowance(address, contract_address, function (error, allowance) {
              if (!error) {
                Tokens.upsert(token_id, { $set: { allowance: allowance.toString(10) } })
              }
            })
          }
        })
      })
    } else {
      ALL_TOKENS.forEach(function (token) {
        Tokens.upsert(token, { $set: { balance: '0', allowance: '0' } })
      })
    }
  }
}

export { Tokens }
