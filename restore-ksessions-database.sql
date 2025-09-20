-- =================================================================
-- KSESSIONS_DEV Database Restoration Script
-- Restores complete dbo schema while preserving canvas schema
-- Date: September 20, 2025
-- =================================================================

USE [KSESSIONS_DEV]
GO

-- Disable constraints temporarily for data loading
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"
GO

-- =================================================================
-- PHASE 1: DROP EXISTING DBO TABLES (EXCEPT CANVAS SCHEMA)
-- =================================================================
PRINT 'Phase 1: Cleaning existing dbo tables (preserving canvas schema)...'

-- Drop existing dbo tables that will be recreated
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Countries]') AND type in (N'U'))
    DROP TABLE [dbo].[Countries]
GO

-- =================================================================
-- PHASE 2: CREATE ALL DBO TABLES
-- =================================================================
PRINT 'Phase 2: Creating dbo tables...'

-- AppSettings Table
CREATE TABLE [dbo].[AppSettings] (
    [AppSettingID] int IDENTITY(1,1) PRIMARY KEY,
    [AppSettingKey] varchar(50) NULL,
    [AppSettingValue] varchar(255) NULL
);
GO

-- AuditCodeTypes Table
CREATE TABLE [dbo].[AuditCodeTypes] (
    [AuditCodeID] int IDENTITY(1,1) PRIMARY KEY,
    [AuditCodeLabel] varchar(150) NOT NULL
);
GO

-- AuditLogs Table
CREATE TABLE [dbo].[AuditLogs] (
    [AuditID] int IDENTITY(1,1) PRIMARY KEY,
    [CreatedDate] datetime NOT NULL,
    [SysCreatedDate] datetime NULL,
    [AuditCodeID] int NOT NULL,
    [AuditDesc] varchar(500) NOT NULL,
    [EntityID] int NULL,
    [EntityName] varchar(50) NULL
);
GO

-- AuthProfile Table
CREATE TABLE [dbo].[AuthProfile] (
    [AuthID] int IDENTITY(1,1) PRIMARY KEY,
    [MemberID] int NOT NULL,
    [ClientID] varchar(255) NULL,
    [CreatedAt] datetime NULL,
    [Email] varchar(255) NULL,
    [IsEmailVerified] bit NULL,
    [FamilyName] varchar(100) NULL,
    [GivenName] varchar(100) NULL,
    [Picture] varchar(500) NULL,
    [Locale] varchar(10) NULL
);
GO

-- Categories Table
CREATE TABLE [dbo].[Categories] (
    [CategoryID] int IDENTITY(1,1) PRIMARY KEY,
    [CategoryName] varchar(255) NOT NULL,
    [GroupID] int NULL,
    [IsActive] bit NOT NULL DEFAULT 1,
    [CreatedDate] datetime NULL,
    [ChangedDate] datetime NULL,
    [SortOrder] int NULL
);
GO

-- Countries Table (RESTORED)
CREATE TABLE [dbo].[Countries] (
    [CountryID] int IDENTITY(1,1) PRIMARY KEY,
    [ISO2] varchar(5) NOT NULL,
    [ISO3] varchar(5) NULL,
    [CountryName] varchar(150) NOT NULL,
    [NumericCode] varchar(5) NULL,
    [PhoneCode] varchar(5) NULL,
    [IsActive] bit NOT NULL DEFAULT 1
);
GO

-- ExceptionLogs Table
CREATE TABLE [dbo].[ExceptionLogs] (
    [ExceptionID] int IDENTITY(1,1) PRIMARY KEY,
    [LogTimeStamp] datetime NOT NULL,
    [LogLevel] varchar(100) NOT NULL,
    [Logger] varchar(1000) NOT NULL,
    [Message] varchar(3600) NOT NULL,
    [Exception] varchar(3600) NULL
);
GO

-- Families Table
CREATE TABLE [dbo].[Families] (
    [FamilyID] int IDENTITY(1,1) PRIMARY KEY,
    [FamilyName] varchar(100) NOT NULL,
    [CreatedDate] datetime NOT NULL,
    [ChangedDate] datetime NULL,
    [IsActive] bit NOT NULL DEFAULT 1
);
GO

-- Groups Table
CREATE TABLE [dbo].[Groups] (
    [GroupID] int IDENTITY(1,1) PRIMARY KEY,
    [GroupName] nvarchar(50) NOT NULL,
    [GroupImage] varchar(255) NULL,
    [GroupDescription] nvarchar(MAX) NULL,
    [Syllabus] varchar(500) NULL,
    [SpeakerID] int NULL,
    [IsCommunityCourse] bit NOT NULL DEFAULT 0,
    [CreatedDate] datetime NULL,
    [ChangedDate] datetime NULL,
    [IsActive] bit NOT NULL DEFAULT 1,
    [SortOrder] int NULL
);
GO

-- GroupMembers Table
CREATE TABLE [dbo].[GroupMembers] (
    [GroupMemberID] int IDENTITY(1,1) PRIMARY KEY,
    [GroupID] int NULL,
    [MemberID] int NULL,
    [IsPassive] bit NOT NULL DEFAULT 0
);
GO

-- Members Table  
CREATE TABLE [dbo].[Members] (
    [MemberID] int IDENTITY(1,1) PRIMARY KEY,
    [FamilyID] int NOT NULL,
    [MemberName] varchar(100) NULL,
    [FirstName] varchar(50) NULL,
    [LastName] varchar(50) NULL,
    [NickName] varchar(100) NULL,
    [EmailAddress] varchar(100) NULL,
    [PhoneNumber] varchar(20) NULL,
    [CountryID] int NULL,
    [IsActive] bit NOT NULL DEFAULT 1,
    [CreatedDate] datetime NOT NULL,
    [ChangedDate] datetime NULL,
    [IsEmailSubscriptionActive] bit NOT NULL DEFAULT 1
);
GO

-- Sessions Table
CREATE TABLE [dbo].[Sessions] (
    [SessionID] int IDENTITY(1,1) PRIMARY KEY,
    [SessionTitle] nvarchar(255) NOT NULL,
    [SessionDescription] nvarchar(MAX) NULL,
    [GroupID] int NOT NULL,
    [CategoryID] int NULL,
    [SpeakerID] int NULL,
    [SessionDate] datetime NULL,
    [Duration] int NULL,
    [IsActive] bit NOT NULL DEFAULT 1,
    [CreatedDate] datetime NOT NULL,
    [ChangedDate] datetime NULL,
    [SortOrder] int NULL,
    [VideoPath] varchar(500) NULL,
    [AudioPath] varchar(500) NULL
);
GO

PRINT 'Phase 2 Complete: All dbo tables created successfully'
GO

-- =================================================================
-- PHASE 3: INSERT COUNTRIES DATA
-- =================================================================
PRINT 'Phase 3: Inserting Countries data...'

SET IDENTITY_INSERT [dbo].[Countries] ON;
INSERT INTO [dbo].[Countries] ([CountryID], [ISO2], [ISO3], [CountryName], [NumericCode], [PhoneCode], [IsActive]) VALUES 
(1, 'AF', 'AFG', 'Afghanistan', '004', '93', 1),
(2, 'AL', 'ALB', 'Albania', '008', '355', 1),
(3, 'DZ', 'DZA', 'Algeria', '012', '213', 1),
(4, 'AS', 'ASM', 'American Samoa', '016', '1684', 1),
(5, 'AD', 'AND', 'Andorra', '020', '376', 1),
(6, 'AO', 'AGO', 'Angola', '024', '244', 1),
(7, 'AI', 'AIA', 'Anguilla', '660', '1264', 1),
(8, 'AQ', 'ATA', 'Antarctica', '010', '672', 1),
(9, 'AG', 'ATG', 'Antigua and Barbuda', '028', '1268', 1),
(10, 'AR', 'ARG', 'Argentina', '032', '54', 1),
(11, 'AM', 'ARM', 'Armenia', '051', '374', 1),
(12, 'AW', 'ABW', 'Aruba', '533', '297', 1),
(13, 'AU', 'AUS', 'Australia', '036', '61', 1),
(14, 'AT', 'AUT', 'Austria', '040', '43', 1),
(15, 'AZ', 'AZE', 'Azerbaijan', '031', '994', 1),
(16, 'BS', 'BHS', 'Bahamas', '044', '1242', 1),
(17, 'BH', 'BHR', 'Bahrain', '048', '973', 1),
(18, 'BD', 'BGD', 'Bangladesh', '050', '880', 1),
(19, 'BB', 'BRB', 'Barbados', '052', '1246', 1),
(20, 'BY', 'BLR', 'Belarus', '112', '375', 1),
(21, 'BE', 'BEL', 'Belgium', '056', '32', 1),
(22, 'BZ', 'BLZ', 'Belize', '084', '501', 1),
(23, 'BJ', 'BEN', 'Benin', '204', '229', 1),
(24, 'BM', 'BMU', 'Bermuda', '060', '1441', 1),
(25, 'BT', 'BTN', 'Bhutan', '064', '975', 1),
(26, 'BO', 'BOL', 'Bolivia', '068', '591', 1),
(27, 'BA', 'BIH', 'Bosnia and Herzegovina', '070', '387', 1),
(28, 'BW', 'BWA', 'Botswana', '072', '267', 1),
(29, 'BV', 'BVT', 'Bouvet Island', '074', '', 1),
(30, 'BR', 'BRA', 'Brazil', '076', '55', 1),
(31, 'IO', 'IOT', 'British Indian Ocean Territory', '086', '246', 1),
(32, 'BN', 'BRN', 'Brunei', '096', '673', 1),
(33, 'BG', 'BGR', 'Bulgaria', '100', '359', 1),
(34, 'BF', 'BFA', 'Burkina Faso', '854', '226', 1),
(35, 'BI', 'BDI', 'Burundi', '108', '257', 1),
(36, 'KH', 'KHM', 'Cambodia', '116', '855', 1),
(37, 'CM', 'CMR', 'Cameroon', '120', '237', 1),
(38, 'CA', 'CAN', 'Canada', '124', '1', 1),
(39, 'CV', 'CPV', 'Cape Verde', '132', '238', 1),
(40, 'KY', 'CYM', 'Cayman Islands', '136', '1345', 1),
(41, 'CF', 'CAF', 'Central African Republic', '140', '236', 1),
(42, 'TD', 'TCD', 'Chad', '148', '235', 1),
(43, 'CL', 'CHL', 'Chile', '152', '56', 1),
(44, 'CN', 'CHN', 'China', '156', '86', 1),
(45, 'CX', 'CXR', 'Christmas Island', '162', '61', 1),
(46, 'CC', 'CCK', 'Cocos Islands', '166', '672', 1),
(47, 'CO', 'COL', 'Colombia', '170', '57', 1),
(48, 'KM', 'COM', 'Comoros', '174', '269', 1),
(49, 'CG', 'COG', 'Congo', '178', '242', 1),
(50, 'CD', 'COD', 'Congo, Democratic Republic', '180', '243', 1),
(51, 'CK', 'COK', 'Cook Islands', '184', '682', 1),
(52, 'CR', 'CRI', 'Costa Rica', '188', '506', 1),
(53, 'CI', 'CIV', 'Cote D''Ivoire', '384', '225', 1),
(54, 'HR', 'HRV', 'Croatia', '191', '385', 1),
(55, 'CU', 'CUB', 'Cuba', '192', '53', 1),
(56, 'CY', 'CYP', 'Cyprus', '196', '357', 1),
(57, 'CZ', 'CZE', 'Czech Republic', '203', '420', 1),
(58, 'DK', 'DNK', 'Denmark', '208', '45', 1),
(59, 'DJ', 'DJI', 'Djibouti', '262', '253', 1),
(60, 'DM', 'DMA', 'Dominica', '212', '1767', 1),
(61, 'DO', 'DOM', 'Dominican Republic', '214', '1809', 1),
(62, 'EC', 'ECU', 'Ecuador', '218', '593', 1),
(63, 'EG', 'EGY', 'Egypt', '818', '20', 1),
(64, 'SV', 'SLV', 'El Salvador', '222', '503', 1),
(65, 'GQ', 'GNQ', 'Equatorial Guinea', '226', '240', 1),
(66, 'ER', 'ERI', 'Eritrea', '232', '291', 1),
(67, 'EE', 'EST', 'Estonia', '233', '372', 1),
(68, 'ET', 'ETH', 'Ethiopia', '231', '251', 1),
(69, 'FK', 'FLK', 'Falkland Islands', '238', '500', 1),
(70, 'FO', 'FRO', 'Faroe Islands', '234', '298', 1),
(71, 'FJ', 'FJI', 'Fiji', '242', '679', 1),
(72, 'FI', 'FIN', 'Finland', '246', '358', 1),
(73, 'FR', 'FRA', 'France', '250', '33', 1),
(74, 'GF', 'GUF', 'French Guiana', '254', '594', 1),
(75, 'PF', 'PYF', 'French Polynesia', '258', '689', 1),
(76, 'TF', 'ATF', 'French Southern Territories', '260', '', 1),
(77, 'GA', 'GAB', 'Gabon', '266', '241', 1),
(78, 'GM', 'GMB', 'Gambia', '270', '220', 1),
(79, 'GE', 'GEO', 'Georgia', '268', '995', 1),
(80, 'DE', 'DEU', 'Germany', '276', '49', 1),
(81, 'GH', 'GHA', 'Ghana', '288', '233', 1),
(82, 'GI', 'GIB', 'Gibraltar', '292', '350', 1),
(83, 'GR', 'GRC', 'Greece', '300', '30', 1),
(84, 'GL', 'GRL', 'Greenland', '304', '299', 1),
(85, 'GD', 'GRD', 'Grenada', '308', '1473', 1),
(86, 'GP', 'GLP', 'Guadeloupe', '312', '590', 1),
(87, 'GU', 'GUM', 'Guam', '316', '1671', 1),
(88, 'GT', 'GTM', 'Guatemala', '320', '502', 1),
(89, 'GG', 'GGY', 'Guernsey', '831', '44', 1),
(90, 'GN', 'GIN', 'Guinea', '324', '224', 1),
(91, 'GW', 'GNB', 'Guinea-Bissau', '624', '245', 1),
(92, 'GY', 'GUY', 'Guyana', '328', '592', 1),
(93, 'HT', 'HTI', 'Haiti', '332', '509', 1),
(94, 'HM', 'HMD', 'Heard and McDonald Islands', '334', '', 1),
(95, 'VA', 'VAT', 'Holy See', '336', '39', 1),
(96, 'HN', 'HND', 'Honduras', '340', '504', 1),
(97, 'HK', 'HKG', 'Hong Kong', '344', '852', 1),
(98, 'HU', 'HUN', 'Hungary', '348', '36', 1),
(99, 'IS', 'ISL', 'Iceland', '352', '354', 1),
(100, 'IN', 'IND', 'India', '356', '91', 1),
(101, 'ID', 'IDN', 'Indonesia', '360', '62', 1),
(102, 'IR', 'IRN', 'Iran', '364', '98', 1),
(103, 'IQ', 'IRQ', 'Iraq', '368', '964', 1),
(104, 'IE', 'IRL', 'Ireland', '372', '353', 1),
(105, 'IM', 'IMN', 'Isle of Man', '833', '44', 1),
(106, 'IL', 'ISR', 'Israel', '376', '972', 1),
(107, 'IT', 'ITA', 'Italy', '380', '39', 1),
(108, 'JM', 'JAM', 'Jamaica', '388', '1876', 1),
(109, 'JP', 'JPN', 'Japan', '392', '81', 1),
(110, 'JE', 'JEY', 'Jersey', '832', '44', 1),
(111, 'JO', 'JOR', 'Jordan', '400', '962', 1),
(112, 'KZ', 'KAZ', 'Kazakhstan', '398', '7', 1),
(113, 'KE', 'KEN', 'Kenya', '404', '254', 1),
(114, 'KI', 'KIR', 'Kiribati', '296', '686', 1),
(115, 'KP', 'PRK', 'Korea, North', '408', '850', 1),
(116, 'KR', 'KOR', 'Korea, South', '410', '82', 1),
(117, 'KW', 'KWT', 'Kuwait', '414', '965', 1),
(118, 'KG', 'KGZ', 'Kyrgyzstan', '417', '996', 1),
(119, 'LA', 'LAO', 'Laos', '418', '856', 1),
(120, 'LV', 'LVA', 'Latvia', '428', '371', 1),
(121, 'LB', 'LBN', 'Lebanon', '422', '961', 1),
(122, 'LS', 'LSO', 'Lesotho', '426', '266', 1),
(123, 'LR', 'LBR', 'Liberia', '430', '231', 1),
(124, 'LY', 'LBY', 'Libya', '434', '218', 1),
(125, 'LI', 'LIE', 'Liechtenstein', '438', '423', 1),
(126, 'LT', 'LTU', 'Lithuania', '440', '370', 1),
(127, 'LU', 'LUX', 'Luxembourg', '442', '352', 1),
(128, 'MO', 'MAC', 'Macao', '446', '853', 1),
(129, 'MK', 'MKD', 'Macedonia', '807', '389', 1),
(130, 'MG', 'MDG', 'Madagascar', '450', '261', 1),
(131, 'MW', 'MWI', 'Malawi', '454', '265', 1),
(132, 'MY', 'MYS', 'Malaysia', '458', '60', 1),
(133, 'MV', 'MDV', 'Maldives', '462', '960', 1),
(134, 'ML', 'MLI', 'Mali', '466', '223', 1),
(135, 'MT', 'MLT', 'Malta', '470', '356', 1),
(136, 'MH', 'MHL', 'Marshall Islands', '584', '692', 1),
(137, 'MQ', 'MTQ', 'Martinique', '474', '596', 1),
(138, 'MR', 'MRT', 'Mauritania', '478', '222', 1),
(139, 'MU', 'MUS', 'Mauritius', '480', '230', 1),
(140, 'YT', 'MYT', 'Mayotte', '175', '269', 1),
(141, 'MX', 'MEX', 'Mexico', '484', '52', 1),
(142, 'FM', 'FSM', 'Micronesia', '583', '691', 1),
(143, 'MD', 'MDA', 'Moldova', '498', '373', 1),
(144, 'MC', 'MCO', 'Monaco', '492', '377', 1),
(145, 'MN', 'MNG', 'Mongolia', '496', '976', 1),
(146, 'ME', 'MNE', 'Montenegro', '499', '382', 1),
(147, 'MS', 'MSR', 'Montserrat', '500', '1664', 1),
(148, 'MA', 'MAR', 'Morocco', '504', '212', 1),
(149, 'MZ', 'MOZ', 'Mozambique', '508', '258', 1),
(150, 'MM', 'MMR', 'Myanmar', '104', '95', 1),
(151, 'NA', 'NAM', 'Namibia', '516', '264', 1),
(152, 'NR', 'NRU', 'Nauru', '520', '674', 1),
(153, 'NP', 'NPL', 'Nepal', '524', '977', 1),
(154, 'NL', 'NLD', 'Netherlands', '528', '31', 1),
(155, 'AN', 'ANT', 'Netherlands Antilles', '530', '599', 1),
(156, 'NC', 'NCL', 'New Caledonia', '540', '687', 1),
(157, 'NZ', 'NZL', 'New Zealand', '554', '64', 1),
(158, 'NI', 'NIC', 'Nicaragua', '558', '505', 1),
(159, 'NE', 'NER', 'Niger', '562', '227', 1),
(160, 'NG', 'NGA', 'Nigeria', '566', '234', 1),
(161, 'NU', 'NIU', 'Niue', '570', '683', 1),
(162, 'NF', 'NFK', 'Norfolk Island', '574', '672', 1),
(163, 'MP', 'MNP', 'Northern Mariana Islands', '580', '1670', 1),
(164, 'NO', 'NOR', 'Norway', '578', '47', 1),
(165, 'OM', 'OMN', 'Oman', '512', '968', 1),
(166, 'PK', 'PAK', 'Pakistan', '586', '92', 1),
(167, 'PW', 'PLW', 'Palau', '585', '680', 1),
(168, 'PS', 'PSE', 'Palestine', '275', '970', 1),
(169, 'PA', 'PAN', 'Panama', '591', '507', 1),
(170, 'PG', 'PNG', 'Papua New Guinea', '598', '675', 1),
(171, 'PY', 'PRY', 'Paraguay', '600', '595', 1),
(172, 'PE', 'PER', 'Peru', '604', '51', 1),
(173, 'PH', 'PHL', 'Philippines', '608', '63', 1),
(174, 'PN', 'PCN', 'Pitcairn', '612', '', 1),
(175, 'PL', 'POL', 'Poland', '616', '48', 1),
(176, 'PT', 'PRT', 'Portugal', '620', '351', 1),
(177, 'PR', 'PRI', 'Puerto Rico', '630', '1787', 1),
(178, 'QA', 'QAT', 'Qatar', '634', '974', 1),
(179, 'RE', 'REU', 'Reunion', '638', '262', 1),
(180, 'RO', 'ROU', 'Romania', '642', '40', 1),
(181, 'RU', 'RUS', 'Russian Federation', '643', '7', 1),
(182, 'RW', 'RWA', 'Rwanda', '646', '250', 1),
(183, 'BL', 'BLM', 'Saint Barthelemy', '652', '590', 1),
(184, 'SH', 'SHN', 'Saint Helena', '654', '290', 1),
(185, 'KN', 'KNA', 'Saint Kitts and Nevis', '659', '1869', 1),
(186, 'LC', 'LCA', 'Saint Lucia', '662', '1758', 1),
(187, 'MF', 'MAF', 'Saint Martin', '663', '590', 1),
(188, 'PM', 'SPM', 'Saint Pierre and Miquelon', '666', '508', 1),
(189, 'VC', 'VCT', 'Saint Vincent and the Grenadines', '670', '1784', 1),
(190, 'WS', 'WSM', 'Samoa', '882', '685', 1),
(191, 'SM', 'SMR', 'San Marino', '674', '378', 1),
(192, 'ST', 'STP', 'Sao Tome and Principe', '678', '239', 1),
(193, 'SA', 'SAU', 'Saudi Arabia', '682', '966', 1),
(194, 'SN', 'SEN', 'Senegal', '686', '221', 1),
(195, 'RS', 'SRB', 'Serbia', '688', '381', 1),
(196, 'SC', 'SYC', 'Seychelles', '690', '248', 1),
(197, 'SL', 'SLE', 'Sierra Leone', '694', '232', 1),
(198, 'SG', 'SGP', 'Singapore', '702', '65', 1),
(199, 'SK', 'SVK', 'Slovakia', '703', '421', 1),
(200, 'SI', 'SVN', 'Slovenia', '705', '386', 1),
(201, 'SB', 'SLB', 'Solomon Islands', '090', '677', 1),
(202, 'SO', 'SOM', 'Somalia', '706', '252', 1),
(203, 'ZA', 'ZAF', 'South Africa', '710', '27', 1),
(204, 'GS', 'SGS', 'South Georgia', '239', '', 1),
(205, 'ES', 'ESP', 'Spain', '724', '34', 1),
(206, 'LK', 'LKA', 'Sri Lanka', '144', '94', 1),
(207, 'SD', 'SDN', 'Sudan', '736', '249', 1),
(208, 'SR', 'SUR', 'Suriname', '740', '597', 1),
(209, 'SJ', 'SJM', 'Svalbard and Jan Mayen', '744', '47', 1),
(210, 'SZ', 'SWZ', 'Swaziland', '748', '268', 1),
(211, 'SE', 'SWE', 'Sweden', '752', '46', 1),
(212, 'CH', 'CHE', 'Switzerland', '756', '41', 1),
(213, 'SY', 'SYR', 'Syria', '760', '963', 1),
(214, 'TW', 'TWN', 'Taiwan', '158', '886', 1),
(215, 'TJ', 'TJK', 'Tajikistan', '762', '992', 1),
(216, 'TZ', 'TZA', 'Tanzania', '834', '255', 1),
(217, 'TH', 'THA', 'Thailand', '764', '66', 1),
(218, 'TL', 'TLS', 'Timor-Leste', '626', '670', 1),
(219, 'TG', 'TGO', 'Togo', '768', '228', 1),
(220, 'TK', 'TKL', 'Tokelau', '772', '690', 1),
(221, 'TO', 'TON', 'Tonga', '776', '676', 1),
(222, 'TT', 'TTO', 'Trinidad and Tobago', '780', '1868', 1),
(223, 'TN', 'TUN', 'Tunisia', '788', '216', 1),
(224, 'TR', 'TUR', 'Turkey', '792', '90', 1),
(225, 'TM', 'TKM', 'Turkmenistan', '795', '993', 1),
(226, 'TC', 'TCA', 'Turks and Caicos Islands', '796', '1649', 1),
(227, 'TV', 'TUV', 'Tuvalu', '798', '688', 1),
(228, 'UG', 'UGA', 'Uganda', '800', '256', 1),
(229, 'UA', 'UKR', 'Ukraine', '804', '380', 1),
(230, 'AE', 'ARE', 'United Arab Emirates', '784', '971', 1),
(231, 'GB', 'GBR', 'United Kingdom', '826', '44', 1),
(232, 'US', 'USA', 'United States', '840', '1', 1),
(233, 'UM', 'UMI', 'United States Minor Outlying Islands', '581', '1', 1),
(234, 'UY', 'URY', 'Uruguay', '858', '598', 1),
(235, 'UZ', 'UZB', 'Uzbekistan', '860', '998', 1),
(236, 'VU', 'VUT', 'Vanuatu', '548', '678', 1),
(237, 'VE', 'VEN', 'Venezuela', '862', '58', 1),
(238, 'VN', 'VNM', 'Vietnam', '704', '84', 1),
(239, 'VG', 'VGB', 'Virgin Islands, British', '092', '1284', 1),
(240, 'VI', 'VIR', 'Virgin Islands, U.S.', '850', '1340', 1),
(241, 'WF', 'WLF', 'Wallis and Futuna', '876', '681', 1),
(242, 'EH', 'ESH', 'Western Sahara', '732', '212', 1),
(243, 'YE', 'YEM', 'Yemen', '887', '967', 1),
(244, 'ZM', 'ZMB', 'Zambia', '894', '260', 1),
(245, 'ZW', 'ZWE', 'Zimbabwe', '716', '263', 1);
SET IDENTITY_INSERT [dbo].[Countries] OFF;

PRINT 'Phase 3 Complete: Countries data inserted successfully'
GO

-- =================================================================
-- PHASE 4: CREATE FOREIGN KEY CONSTRAINTS
-- =================================================================
PRINT 'Phase 4: Creating foreign key constraints...'

-- Categories foreign keys
ALTER TABLE [dbo].[Categories]
ADD CONSTRAINT [FK_Categories_Groups] FOREIGN KEY ([GroupID])
REFERENCES [dbo].[Groups] ([GroupID])
GO

-- GroupMembers foreign keys  
ALTER TABLE [dbo].[GroupMembers]
ADD CONSTRAINT [FK_GroupMembers_Groups] FOREIGN KEY ([GroupID])
REFERENCES [dbo].[Groups] ([GroupID])
GO

ALTER TABLE [dbo].[GroupMembers]
ADD CONSTRAINT [FK_GroupMembers_Members] FOREIGN KEY ([MemberID])
REFERENCES [dbo].[Members] ([MemberID])
GO

-- Members foreign keys
ALTER TABLE [dbo].[Members]
ADD CONSTRAINT [FK_Members_Families] FOREIGN KEY ([FamilyID])
REFERENCES [dbo].[Families] ([FamilyID])
GO

ALTER TABLE [dbo].[Members]
ADD CONSTRAINT [FK_Members_Countries] FOREIGN KEY ([CountryID])
REFERENCES [dbo].[Countries] ([CountryID])
GO

-- Sessions foreign keys
ALTER TABLE [dbo].[Sessions]
ADD CONSTRAINT [FK_Sessions_Groups] FOREIGN KEY ([GroupID])
REFERENCES [dbo].[Groups] ([GroupID])
GO

ALTER TABLE [dbo].[Sessions]
ADD CONSTRAINT [FK_Sessions_Categories] FOREIGN KEY ([CategoryID])
REFERENCES [dbo].[Categories] ([CategoryID])
GO

-- AuditLogs foreign keys
ALTER TABLE [dbo].[AuditLogs]
ADD CONSTRAINT [FK_AuditLogs_AuditCodeTypes] FOREIGN KEY ([AuditCodeID])
REFERENCES [dbo].[AuditCodeTypes] ([AuditCodeID])
GO

PRINT 'Phase 4 Complete: Foreign key constraints created'
GO

-- =================================================================
-- PHASE 5: CREATE INDEXES FOR PERFORMANCE
-- =================================================================
PRINT 'Phase 5: Creating indexes...'

-- Categories indexes
CREATE NONCLUSTERED INDEX [IX_Categories_GroupID] ON [dbo].[Categories]([GroupID])
CREATE NONCLUSTERED INDEX [IX_Categories_GroupID_IsActive] ON [dbo].[Categories]([GroupID], [IsActive])

-- Countries indexes
CREATE NONCLUSTERED INDEX [IX_Countries_IsActive] ON [dbo].[Countries]([IsActive])
CREATE NONCLUSTERED INDEX [IX_Countries_CountryName] ON [dbo].[Countries]([CountryName])
CREATE NONCLUSTERED INDEX [IX_Countries_ISO2] ON [dbo].[Countries]([ISO2])

-- Groups indexes
CREATE NONCLUSTERED INDEX [IX_Groups_IsActive] ON [dbo].[Groups]([IsActive])
CREATE NONCLUSTERED INDEX [IX_Groups_SortOrder] ON [dbo].[Groups]([SortOrder])

-- Members indexes
CREATE NONCLUSTERED INDEX [IX_Members_FamilyID] ON [dbo].[Members]([FamilyID])
CREATE NONCLUSTERED INDEX [IX_Members_CountryID] ON [dbo].[Members]([CountryID])
CREATE NONCLUSTERED INDEX [IX_Members_EmailAddress] ON [dbo].[Members]([EmailAddress])
CREATE NONCLUSTERED INDEX [IX_Members_IsActive] ON [dbo].[Members]([IsActive])

-- Sessions indexes
CREATE NONCLUSTERED INDEX [IX_Sessions_GroupID] ON [dbo].[Sessions]([GroupID])
CREATE NONCLUSTERED INDEX [IX_Sessions_CategoryID] ON [dbo].[Sessions]([CategoryID])
CREATE NONCLUSTERED INDEX [IX_Sessions_GroupID_CategoryID_IsActive] ON [dbo].[Sessions]([GroupID], [CategoryID], [IsActive])
CREATE NONCLUSTERED INDEX [IX_Sessions_IsActive] ON [dbo].[Sessions]([IsActive])

PRINT 'Phase 5 Complete: Indexes created successfully'
GO

-- =================================================================
-- PHASE 6: RE-ENABLE CONSTRAINTS
-- =================================================================
PRINT 'Phase 6: Re-enabling constraints...'

EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all"
GO

PRINT 'Phase 6 Complete: All constraints re-enabled'
GO

-- =================================================================
-- PHASE 7: VERIFY DATABASE RESTORATION
-- =================================================================
PRINT 'Phase 7: Verifying database restoration...'

PRINT 'Canvas Schema Objects:'
SELECT SCHEMA_NAME(schema_id) as SchemaName, name as ObjectName, type_desc 
FROM sys.objects 
WHERE SCHEMA_NAME(schema_id) = 'canvas' AND type IN ('U', 'V', 'P', 'FN') 
ORDER BY type_desc, name

PRINT 'DBO Schema Tables:'
SELECT SCHEMA_NAME(schema_id) as SchemaName, name as ObjectName, type_desc 
FROM sys.objects 
WHERE SCHEMA_NAME(schema_id) = 'dbo' AND type = 'U' 
ORDER BY name

PRINT 'Countries Table Verification:'
SELECT COUNT(*) as CountryCount FROM [dbo].[Countries] WHERE IsActive = 1

PRINT '==================================================================='
PRINT 'KSESSIONS_DEV Database Restoration Complete!'
PRINT 'Canvas schema preserved, dbo schema fully restored with all tables'
PRINT 'Countries table created with 245 countries'
PRINT '==================================================================='