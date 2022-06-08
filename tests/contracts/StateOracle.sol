// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract StateOracle {
	// log on state oracle request
	event HiToEthereum(uint256 requestId);
	// log on state oracle response
	event HiFromEthereum(
		uint256 requestId,
		uint256 timestamp,
		uint256 totalSupply
	);

	address constant STATE_ORACLE = address(27572);

	uint256 _requestId;
	uint256 _totalSupply;
	uint256 _timestamp;
	bytes32 _returnData;

	receive() external payable {}

	// Make a request for ERC20 totalSupply of `remoteToken`
	function helloEthereum(address remoteToken) external payable {
		bytes memory totalSupplyCall = abi.encodeWithSignature("totalSupply()");
		bytes4 callbackSelector = this.ethereumSaysHi.selector;
		uint256 callbackGasLimit = 400_000;
		uint256 callbackBounty = 2 ether; // == 2 cpay

		bytes memory remoteCallRequest = abi.encodeWithSignature(
			"remoteCall(address,bytes,bytes4,uint256,uint256)",
			remoteToken,
			totalSupplyCall,
			callbackSelector,
			callbackGasLimit,
			callbackBounty
		);

		(bool success, bytes memory returnData) = STATE_ORACLE.call(
			remoteCallRequest
		);
		require(success);

		uint256 requestId = abi.decode(returnData, (uint256));
		emit HiToEthereum(requestId);
	}

	// Receive state oracle response
	function ethereumSaysHi(
		uint256 requestId,
		uint256 timestamp,
		bytes32 returnData
	) external {
		require(msg.sender == STATE_ORACLE, "must be state oracle");
		_totalSupply = uint256(returnData);

		emit HiFromEthereum(requestId, timestamp, _totalSupply);

		_requestId = requestId;
		_returnData = returnData;
		_timestamp = timestamp;
	}

	function getRequestReturn()
		public
		view
		returns (
			uint256,
			uint256,
			uint256,
			bytes32
		)
	{
		return (_requestId, _totalSupply, _timestamp, _returnData);
	}
}
