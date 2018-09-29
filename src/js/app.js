App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    // Load pets.
    $.getJSON('../sponsorships.json', function(data) {
      var bountyRow = $('#bountyRow');

      for (i = 0; i < data.length; i ++) {
        var bountyTemplate = $('#bountyTemplate').clone();
        bountyTemplate.find('.panel-title').text(data[i].name);
        bountyTemplate.find('img').attr('src', data[i].picture);
        bountyTemplate.find('.btn-sponsor').attr('data-id', data[i].question_id);
        bountyTemplate.find('.btn-sponsor').attr('data-developer', data[i].developer);
        bountyTemplate.find('.btn-claim').attr('data-id', data[i].question_id);
        bountyTemplate.attr('id', 'bounty-' + data[i].question_id);
        bountyRow.append(bountyTemplate);
        bountyTemplate.show();
      }
    });

    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {

    $.getJSON('Sponsorship.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var SponsorshipArtifact = data;
      App.contracts.Sponsorship = TruffleContract(SponsorshipArtifact);

      // Set the provider for our contract
      App.contracts.Sponsorship.setProvider(App.web3Provider);

      var question_ids = [];
      $.getJSON('../sponsorships.json', function(data) {
         var question_ids = []; 
         for(var i=0; i<data.length; i++) {
           question_ids.push(data[i].question_id);
         }
         return App.refreshDisplay(question_ids);
      });
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-sponsor', App.handleSponsor);
    $(document).on('click', '.btn-claim', App.handleClaim);
  },

  refreshDisplay: function(question_ids) {
    var sponsorInstance;

    var populateEntry = function(qid, instance) {
      //console.log('calling for question_id ', qid);
      instance.bounties.call(qid).then(function(bounty_data) {
        console.log(qid, bounty_data);
        var developer = bounty_data[0]; 
        var sponsor = bounty_data[1]; 
        var amount = bounty_data[2]; 
        var panel = $('#bounty-' + qid);
        console.log('amount is ', amount.toString());

        instance.isFinalized.call(qid).then(function(is_finalized) {
          console.log(qid, 'is_finalized', is_finalized);

          if (is_finalized) {

             instance.isMilestoneCompleted.call(qid).then(function(is_completed) {
                if (is_completed) {
                  panel.find('.is-completed').text('Completed!');
                } else {
                  panel.find('.is-completed').text('Failed!');
                }
             });

             if (amount.gt(0)) {

                panel.find('.claim-display').show();

             }
/*
            console.log(qid, 'is_finalized', is_finalized);
            if (is_claimable) {
               panel.addClass('claimable');
               panel.find('.claim-display').show();
            } else {
               panel.addClass('unclaimable');
            }
          instance.isClaimable.call(qid).then(function(is_claimable) {
            console.log(qid, 'is_claimable', is_claimable);
            if (is_claimable) {
               panel.addClass('claimable');
               panel.find('.claim-display').show();
            } else {
               panel.addClass('unclaimable');
            }
          });
          */
         } else {

             if (amount.gt(0)) {

               panel.find('.unsponsored-display').hide();
               panel.find('.sponsored-display').show();

               panel.find('.developer').text(developer);
               panel.find('.sponsor').text(sponsor);
               panel.find('.amount-eth').text(web3.fromWei(amount, 'ether').toString());
               panel.addClass('sponsored');

             } else {
            
               panel.find('.unsponsored-display').show();
               panel.find('.sponsored-display').hide();

             }

          }
        });
      });
    }

    App.contracts.Sponsorship.deployed().then(function(instance) {
      for (var i=0; i<question_ids.length; i++) {
        var question_id = question_ids[i];
        populateEntry(question_id, instance);
      }
    })
  },

  handleSponsor: function(event) {
    event.preventDefault();

    var bountyId = $(event.target).data('id');
    var developer = $(event.target).data('developer');
    var amount_eth = $(event.target).closest('div').find('.amount-input').val();
    var amount_wei = web3.toWei(amount_eth);

    var sponsorInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Sponsorship.deployed().then(function(instance) {
        sponsorInstance = instance;

        // Execute adopt as a transaction by sending account
        return sponsorInstance.sponsor(bountyId, developer, {from: account, value: amount_wei});
      }).then(function(result) {
        return App.refreshDisplay([bountyId]);
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  handleClaim: function(event) {
    event.preventDefault();

    var bountyId = $(event.target).data('id');
    var sponsorInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Sponsorship.deployed().then(function(instance) {
        sponsorInstance = instance;

        // Execute adopt as a transaction by sending account
        return sponsorInstance.claim(bountyId, {from: account});
      }).then(function(result) {
        return App.refreshDisplay([bountyId]);
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
