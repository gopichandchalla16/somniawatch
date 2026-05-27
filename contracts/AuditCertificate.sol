// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title  AuditCertificate
/// @notice On-chain NFT security certificate issued to smart contracts
///         that achieve consecutive SAFE audits via SomniaWatch
/// @author Gopichand Challa - Somnia Agentathon 2026
///
/// @dev Soulbound NFT (non-transferable) - represents verified security status.
///      Only SomniaWatch contract can mint/revoke certificates.
///      Metadata is fully on-chain - no IPFS dependency.
///
///      Certificate levels:
///        Bronze  - 3  consecutive SAFE audits
///        Silver  - 7  consecutive SAFE audits
///        Gold    - 15 consecutive SAFE audits
///
///      When a contract is flagged CRITICAL by SomniaWatch agents,
///      its certificate is automatically REVOKED - no human needed.

contract AuditCertificate {

    // ================================================================
    //  TYPES
    // ================================================================

    enum CertLevel { BRONZE, SILVER, GOLD }

    struct Certificate {
        address    contractAddress;  // The monitored smart contract
        address    owner;            // Owner who registered the contract
        CertLevel  level;
        uint256    consecutiveSafe;  // Safe audits at time of mint
        uint256    issuedAt;
        uint256    lastAuditReceipt; // Somnia agent requestId (proof)
        bool       isRevoked;
    }

    // ================================================================
    //  STATE
    // ================================================================

    uint256 public nextTokenId = 1;

    mapping(uint256  => Certificate) public certificates;    // tokenId => cert
    mapping(address  => uint256)     public contractToToken; // contract => tokenId
    mapping(uint256  => address)     public tokenOwner;      // tokenId => owner
    mapping(address  => uint256[])   public ownerTokens;     // owner => tokenIds

    address public somniaWatch;  // Only SomniaWatch can mint/revoke
    address public admin;

    // Level thresholds
    uint256 public constant BRONZE_THRESHOLD = 3;
    uint256 public constant SILVER_THRESHOLD = 7;
    uint256 public constant GOLD_THRESHOLD   = 15;

    // ================================================================
    //  EVENTS
    // ================================================================

    event CertificateMinted  (uint256 indexed tokenId, address indexed contractAddr, CertLevel level, uint256 receipt);
    event CertificateRevoked (uint256 indexed tokenId, address indexed contractAddr, uint256 receipt);
    event CertificateUpgraded(uint256 indexed tokenId, CertLevel newLevel);

    // ================================================================
    //  CONSTRUCTOR
    // ================================================================

    constructor(address _somniaWatch) {
        somniaWatch = _somniaWatch;
        admin       = msg.sender;
    }

    // ================================================================
    //  MINTING - only SomniaWatch can call
    // ================================================================

    /// @notice Mint a security certificate NFT for a verified-safe contract
    /// @param contractAddr   The smart contract that passed audits
    /// @param owner          The contract's registered owner
    /// @param consecutiveSafe Number of consecutive safe audits
    /// @param agentReceipt   Somnia agent requestId as proof of AI decision
    function mintCertificate(
        address contractAddr,
        address owner,
        uint256 consecutiveSafe,
        uint256 agentReceipt
    ) external returns (uint256 tokenId) {
        require(msg.sender == somniaWatch, "Only SomniaWatch can mint");
        require(consecutiveSafe >= BRONZE_THRESHOLD, "Need 3+ safe audits");
        require(contractToToken[contractAddr] == 0, "Certificate already exists");

        CertLevel level = _getLevel(consecutiveSafe);

        tokenId = nextTokenId++;

        certificates[tokenId] = Certificate({
            contractAddress: contractAddr,
            owner:           owner,
            level:           level,
            consecutiveSafe: consecutiveSafe,
            issuedAt:        block.timestamp,
            lastAuditReceipt:agentReceipt,
            isRevoked:       false
        });

        tokenOwner[tokenId]          = owner;
        contractToToken[contractAddr] = tokenId;
        ownerTokens[owner].push(tokenId);

        emit CertificateMinted(tokenId, contractAddr, level, agentReceipt);
    }

    /// @notice Upgrade certificate level when more safe audits accumulate
    function upgradeCertificate(
        address contractAddr,
        uint256 newConsecutiveSafe,
        uint256 agentReceipt
    ) external {
        require(msg.sender == somniaWatch, "Only SomniaWatch can upgrade");
        uint256 tokenId = contractToToken[contractAddr];
        require(tokenId != 0, "No certificate exists");

        Certificate storage cert = certificates[tokenId];
        require(!cert.isRevoked, "Certificate is revoked");

        CertLevel newLevel = _getLevel(newConsecutiveSafe);
        if (newLevel > cert.level) {
            cert.level           = newLevel;
            cert.consecutiveSafe = newConsecutiveSafe;
            cert.lastAuditReceipt= agentReceipt;
            emit CertificateUpgraded(tokenId, newLevel);
        }
    }

    /// @notice Revoke certificate when contract is flagged CRITICAL
    /// @dev Called automatically by SomniaWatch on CRITICAL classification
    function revokeCertificate(
        address contractAddr,
        uint256 agentReceipt
    ) external {
        require(msg.sender == somniaWatch, "Only SomniaWatch can revoke");
        uint256 tokenId = contractToToken[contractAddr];
        if (tokenId == 0) return; // No cert, nothing to revoke

        Certificate storage cert = certificates[tokenId];
        if (cert.isRevoked) return;

        cert.isRevoked         = true;
        cert.lastAuditReceipt  = agentReceipt;

        emit CertificateRevoked(tokenId, contractAddr, agentReceipt);
    }

    // ================================================================
    //  ON-CHAIN SVG METADATA
    // ================================================================

    /// @notice Generate full on-chain SVG metadata for a certificate
    function tokenURI(uint256 tokenId)
        external view returns (string memory)
    {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        Certificate memory cert = certificates[tokenId];

        string memory levelName  = _levelName(cert.level);
        string memory levelColor = _levelColor(cert.level);
        string memory status     = cert.isRevoked ? "REVOKED" : "ACTIVE";
        string memory statusColor= cert.isRevoked ? "#FF4444" : "#00FF88";

        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220">',
            '<rect width="400" height="220" fill="#080810" rx="16"/>',
            '<rect x="1" y="1" width="398" height="218" fill="none" stroke="', levelColor, '" stroke-width="2" rx="15" opacity="0.6"/>',
            '<circle cx="200" cy="45" r="25" fill="', levelColor, '" opacity="0.15"/>',
            '<text x="200" y="52" text-anchor="middle" font-size="24">[Shield]</text>',
            '<text x="200" y="90" text-anchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="', levelColor, '">',
            levelName, ' SECURITY CERTIFICATE</text>',
            '<text x="200" y="112" text-anchor="middle" font-family="monospace" font-size="9" fill="#6B6B90">',
            _shortAddr(cert.contractAddress), '</text>',
            '<text x="200" y="132" text-anchor="middle" font-family="monospace" font-size="10" fill="#E8E8F0">',
            _uint2str(cert.consecutiveSafe), ' consecutive SAFE audits</text>',
            '<text x="200" y="150" text-anchor="middle" font-family="monospace" font-size="9" fill="#6B6B90">',
            'Verified by Somnia LLM Agent #12847293847561029384</text>',
            '<rect x="140" y="162" width="120" height="22" rx="6" fill="', statusColor, '" opacity="0.15"/>',
            '<text x="200" y="177" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="', statusColor, '">',
            status, '</text>',
            '<text x="200" y="208" text-anchor="middle" font-family="monospace" font-size="8" fill="#3A3A5A">',
            'SomniaWatch Agentathon 2026 - Consensus-Validated AI Security</text>',
            '</svg>'
        ));

        string memory json = string(abi.encodePacked(
            '{"name":"SomniaWatch ', levelName, ' Certificate #', _uint2str(tokenId), '",',
            '"description":"AI-verified smart contract security certificate. Issued by SomniaWatch autonomous guardian on Somnia Agentic L1. Every audit is consensus-validated by 3 independent Somnia validators.",',
            '"image":"data:image/svg+xml;base64,', _base64(bytes(svg)), '",',
            '"attributes":[',
            '{"trait_type":"Level","value":"', levelName, '"},',
            '{"trait_type":"Status","value":"', status, '"},',
            '{"trait_type":"Safe Audits","value":', _uint2str(cert.consecutiveSafe), '},',
            '{"trait_type":"Agent Receipt","value":"', _uint2str(cert.lastAuditReceipt), '"},',
            '{"trait_type":"Contract","value":"', _addrStr(cert.contractAddress), '"}',
            ']}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,", _base64(bytes(json))
        ));
    }

    // ================================================================
    //  VIEWS
    // ================================================================

    function getCertificate(address contractAddr)
        external view returns (Certificate memory)
    {
        uint256 tokenId = contractToToken[contractAddr];
        require(tokenId != 0, "No certificate for this contract");
        return certificates[tokenId];
    }

    function hasCertificate(address contractAddr)
        external view returns (bool)
    {
        uint256 tokenId = contractToToken[contractAddr];
        return tokenId != 0 && !certificates[tokenId].isRevoked;
    }

    function getOwnerCertificates(address owner)
        external view returns (uint256[] memory)
    { return ownerTokens[owner]; }

    function totalSupply() external view returns (uint256) {
        return nextTokenId - 1;
    }

    // ================================================================
    //  ADMIN
    // ================================================================

    function updateSomniaWatch(address newWatch) external {
        require(msg.sender == admin, "Admin only");
        somniaWatch = newWatch;
    }

    // ================================================================
    //  INTERNAL HELPERS
    // ================================================================

    function _getLevel(uint256 count) internal pure returns (CertLevel) {
        if (count >= GOLD_THRESHOLD)   return CertLevel.GOLD;
        if (count >= SILVER_THRESHOLD) return CertLevel.SILVER;
        return CertLevel.BRONZE;
    }

    function _levelName(CertLevel l) internal pure returns (string memory) {
        if (l == CertLevel.GOLD)   return "GOLD";
        if (l == CertLevel.SILVER) return "SILVER";
        return "BRONZE";
    }

    function _levelColor(CertLevel l) internal pure returns (string memory) {
        if (l == CertLevel.GOLD)   return "#FFD700";
        if (l == CertLevel.SILVER) return "#C0C0C0";
        return "#CD7F32";
    }

    function _shortAddr(address a) internal pure returns (string memory) {
        bytes memory h = "0123456789abcdef";
        bytes20 b = bytes20(a);
        bytes memory s = new bytes(13);
        s[0]='0'; s[1]='x';
        for (uint i=0;i<4;i++){
            s[2+i*2]=h[uint8(b[i])>>4];
            s[3+i*2]=h[uint8(b[i])&0x0f];
        }
        s[10]='.'; s[11]='.'; s[12]='.';
        return string(s);
    }

    function _addrStr(address a) internal pure returns (string memory) {
        bytes memory h = "0123456789abcdef";
        bytes20 b = bytes20(a);
        bytes memory s = new bytes(42);
        s[0]='0'; s[1]='x';
        for (uint i=0;i<20;i++){
            s[2+i*2]=h[uint8(b[i])>>4];
            s[3+i*2]=h[uint8(b[i])&0x0f];
        }
        return string(s);
    }

    function _uint2str(uint256 n) internal pure returns (string memory) {
        if (n == 0) return "0";
        uint256 tmp = n;
        uint256 digits;
        while (tmp != 0) { digits++; tmp /= 10; }
        bytes memory buf = new bytes(digits);
        while (n != 0) { buf[--digits] = bytes1(uint8(48 + n % 10)); n /= 10; }
        return string(buf);
    }

    bytes internal constant TABLE =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    function _base64(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        bytes memory result = new bytes(encodedLen);
        bytes memory table = TABLE;
        assembly {
            let tablePtr := add(table, 1)
            let dataPtr  := data
            let endPtr   := add(dataPtr, mload(data))
            let resultPtr:= add(result, 32)
            for {} lt(dataPtr, endPtr) {} {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)
                mstore8(resultPtr,       mload(add(tablePtr, and(shr(18, input), 0x3F))))
                mstore8(add(resultPtr,1),mload(add(tablePtr, and(shr(12, input), 0x3F))))
                mstore8(add(resultPtr,2),mload(add(tablePtr, and(shr( 6, input), 0x3F))))
                mstore8(add(resultPtr,3),mload(add(tablePtr, and(        input,  0x3F))))
                resultPtr := add(resultPtr, 4)
            }
            switch mod(mload(data), 3)
            case 1 { mstore8(sub(resultPtr,1),0x3d) mstore8(sub(resultPtr,2),0x3d) }
            case 2 { mstore8(sub(resultPtr,1),0x3d) }
        }
        return string(result);
    }
}
