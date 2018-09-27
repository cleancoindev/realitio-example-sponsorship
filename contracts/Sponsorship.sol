pragma solidity ^0.4.17;

contract RealitioI {
    function getFinalAnswer(bytes32 question_id) public view returns (bytes32);
    function isFinalized(bytes32 question_id) public view returns (bool);
}

contract Sponsorship {

    address realitio;

    struct Bounty {
        address developer;
        address sponsor;
        uint256 amount;
    }
    mapping(bytes32 => Bounty) public bounties;

    constructor(address _realitio) public {
        realitio = _realitio;
    }

    function sponsor(bytes32 question_id, address developer) public payable {
        require(bounties[question_id].amount == 0); 

        bounties[question_id].developer = developer;
        bounties[question_id].sponsor = msg.sender;
        bounties[question_id].amount = msg.value;

        require(!RealitioI(realitio).isFinalized(question_id));
    }

    function claim(bytes32 question_id) public {
        bytes32 answer = RealitioI(realitio).getFinalAnswer(question_id);
        address claimer = (answer == bytes32(1)) ? bounties[question_id].developer : bounties[question_id].sponsor;
        claimer.transfer(bounties[question_id].amount);
        delete (bounties[question_id]);
    }

    function isSponsorable(bytes32 question_id) public view returns (bool) {
        if (bounties[question_id].amount > 0) return false;
        return !RealitioI(realitio).isFinalized(question_id);    
    }

    function isClaimable(bytes32 question_id) public view returns (bool) {
        if (bounties[question_id].amount == 0) return false;
        return RealitioI(realitio).isFinalized(question_id);    
    }

}
