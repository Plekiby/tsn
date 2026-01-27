-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql-cltsn.alwaysdata.net
-- Generation Time: Jan 20, 2026 at 03:10 PM
-- Server version: 10.11.15-MariaDB
-- PHP Version: 8.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cltsn_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `Comment`
--

CREATE TABLE `Comment` (
  `id` int(11) NOT NULL,
  `content` varchar(1000) NOT NULL,
  `postId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Comment`
--

INSERT INTO `Comment` (`id`, `content`, `postId`, `userId`, `createdAt`, `updatedAt`) VALUES
(2, 'et oui hehe', 7, 8, '2026-01-02 16:48:24.258', '2026-01-02 16:48:24.258'),
(3, 'amisss', 6, 8, '2026-01-02 16:48:49.405', '2026-01-02 16:48:49.405'),
(4, 'test comm', 3, 8, '2026-01-02 16:49:22.147', '2026-01-02 16:49:22.147'),
(5, 'Nice 🔥', 8, 6, '2026-01-03 15:59:15.162', '2026-01-03 15:59:15.162'),
(6, 'Je valide 😄', 8, 10, '2026-01-03 15:59:15.162', '2026-01-03 15:59:15.162'),
(7, 'Trop chaud pour la raclette', 10, 6, '2026-01-03 15:59:15.162', '2026-01-03 15:59:15.162'),
(8, 'Haha Ciel 😼', 18, 8, '2026-01-03 15:59:15.162', '2026-01-03 15:59:15.162'),
(9, 'On se capte où ?', 19, 8, '2026-01-03 15:59:15.162', '2026-01-03 15:59:15.162'),
(10, 'test', 7, 8, '2026-01-03 15:32:44.428', '2026-01-03 15:32:44.428'),
(11, 's', 21, 6, '2026-01-03 16:09:07.775', '2026-01-03 16:09:07.775'),
(12, 's', 26, 6, '2026-01-07 11:40:55.220', '2026-01-07 11:40:55.220'),
(13, 's', 27, 6, '2026-01-07 11:41:10.448', '2026-01-07 11:41:10.448'),
(14, 'try', 29, 8, '2026-01-14 01:48:30.000', '0000-00-00 00:00:00.000'),
(15, 'Message', 5, 6, '2026-01-14 01:50:36.000', '0000-00-00 00:00:00.000');

-- --------------------------------------------------------

--
-- Table structure for table `Conversation`
--

CREATE TABLE `Conversation` (
  `id` int(11) NOT NULL,
  `groupId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Conversation`
--

INSERT INTO `Conversation` (`id`, `groupId`, `createdAt`, `updatedAt`) VALUES
(1, NULL, '2026-01-07 16:00:59.978', '2026-01-08 14:54:54.208'),
(2, NULL, '2026-01-13 13:30:38.778', '2026-01-13 13:30:41.695'),
(3, NULL, '2026-01-14 01:48:02.000', '2026-01-14 01:48:02.000'),
(4, NULL, '2026-01-14 10:48:12.000', '2026-01-14 12:14:25.000');

-- --------------------------------------------------------

--
-- Table structure for table `ConversationMember`
--

CREATE TABLE `ConversationMember` (
  `conversationId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `joinedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `lastReadAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ConversationMember`
--

INSERT INTO `ConversationMember` (`conversationId`, `userId`, `joinedAt`, `lastReadAt`) VALUES
(1, 6, '2026-01-07 16:00:59.978', '2026-01-13 13:35:55.202'),
(1, 7, '2026-01-07 16:00:59.978', '2026-01-07 22:11:47.060'),
(2, 6, '2026-01-13 13:30:38.778', '2026-01-13 13:35:50.078'),
(2, 8, '2026-01-13 13:30:38.778', '2026-01-13 23:11:36.000'),
(3, 6, '2026-01-14 01:48:02.753', '2026-01-14 01:48:02.000'),
(3, 25, '2026-01-14 01:48:02.753', NULL),
(4, 8, '2026-01-14 10:48:12.750', '2026-01-14 10:48:49.000'),
(4, 28, '2026-01-14 10:48:12.750', '2026-01-14 12:14:25.000');

-- --------------------------------------------------------

--
-- Table structure for table `Event`
--

CREATE TABLE `Event` (
  `id` int(11) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `location` varchar(191) DEFAULT NULL,
  `startAt` datetime(3) NOT NULL,
  `endAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `groupId` int(11) NOT NULL,
  `creatorId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Event`
--

INSERT INTO `Event` (`id`, `title`, `description`, `location`, `startAt`, `endAt`, `createdAt`, `groupId`, `creatorId`) VALUES
(1, 'Raclette', 'Raclette ndl miam', 'NDL', '2026-01-06 10:50:00.000', '2026-01-08 10:50:00.000', '2026-01-05 10:50:14.272', 1, 6),
(2, 'test', NULL, NULL, '2026-01-22 09:47:00.000', '2026-01-24 09:47:00.000', '2026-01-07 09:47:49.780', 1, 6),
(3, 'eeee', NULL, NULL, '2026-01-23 09:49:00.000', '2026-01-31 09:49:00.000', '2026-01-07 09:49:58.116', 1, 6),
(4, 'ssss', NULL, NULL, '2026-01-15 11:35:00.000', '2026-01-30 11:35:00.000', '2026-01-07 11:35:49.523', 8, 6),
(5, 'dddd', NULL, NULL, '2026-01-27 11:36:00.000', '2026-01-29 11:36:00.000', '2026-01-07 11:36:33.138', 1, 1),
(6, 'sssss', NULL, NULL, '2026-01-16 11:43:00.000', '2026-01-17 11:43:00.000', '2026-01-07 11:43:25.996', 9, 1),
(7, 'aaaa', NULL, NULL, '2026-01-30 11:50:00.000', '2026-01-31 11:50:00.000', '2026-01-07 11:50:21.573', 8, 6),
(8, 'zzzzz', NULL, NULL, '2026-01-16 11:50:00.000', '2026-01-18 11:50:00.000', '2026-01-07 11:50:58.072', 8, 6),
(9, 'qqqqqqqqqqqqqq', NULL, NULL, '2026-01-24 12:03:00.000', '2026-01-30 12:03:00.000', '2026-01-07 12:03:41.880', 1, 1),
(10, 'test event', NULL, NULL, '2026-01-30 16:35:00.000', '2026-01-31 16:35:00.000', '2026-01-13 16:35:47.792', 8, 6);

-- --------------------------------------------------------

--
-- Table structure for table `EventAttendee`
--

CREATE TABLE `EventAttendee` (
  `eventId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `status` enum('GOING','DECLINED') NOT NULL DEFAULT 'GOING',
  `joinedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `EventAttendee`
--

INSERT INTO `EventAttendee` (`eventId`, `userId`, `status`, `joinedAt`) VALUES
(1, 1, 'GOING', '2026-01-07 09:20:12.979'),
(1, 6, 'DECLINED', '2026-01-05 10:50:34.655'),
(2, 1, 'GOING', '2026-01-07 09:48:00.407'),
(3, 1, 'GOING', '2026-01-07 09:50:05.739'),
(4, 7, 'GOING', '2026-01-07 15:05:55.374'),
(8, 7, 'DECLINED', '2026-01-13 16:26:57.059');

-- --------------------------------------------------------

--
-- Table structure for table `Follow`
--

CREATE TABLE `Follow` (
  `followerId` int(11) NOT NULL,
  `followedId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Follow`
--

INSERT INTO `Follow` (`followerId`, `followedId`, `createdAt`) VALUES
(1, 8, '2026-01-02 12:42:50.620'),
(6, 1, '2026-01-13 11:36:05.128'),
(6, 7, '2026-01-13 11:27:15.488'),
(6, 8, '2026-01-13 11:27:11.113'),
(6, 9, '2026-01-03 15:59:15.089'),
(6, 10, '2026-01-03 15:59:15.089'),
(6, 11, '2026-01-08 00:20:06.000'),
(6, 12, '2026-01-08 00:20:06.000'),
(6, 13, '2026-01-03 15:59:15.089'),
(6, 14, '2026-01-08 00:20:06.000'),
(6, 15, '2026-01-08 00:20:06.000'),
(6, 16, '2026-01-08 00:20:06.000'),
(6, 18, '2026-01-13 13:09:29.071'),
(7, 1, '2026-01-02 12:41:54.801'),
(7, 6, '2026-01-08 00:20:06.000'),
(7, 11, '2026-01-08 00:20:06.000'),
(7, 12, '2026-01-08 00:20:06.000'),
(7, 13, '2026-01-08 00:20:06.000'),
(7, 17, '2026-01-13 14:09:03.000'),
(7, 18, '2026-01-13 14:09:03.000'),
(7, 19, '2026-01-13 14:09:03.000'),
(8, 6, '2026-01-03 15:31:42.212'),
(8, 7, '2026-01-08 00:20:06.000'),
(8, 9, '2026-01-08 00:20:06.000'),
(8, 10, '2026-01-08 00:20:06.000'),
(8, 11, '2026-01-03 15:59:15.089'),
(8, 12, '2026-01-13 22:48:13.485'),
(8, 13, '2026-01-08 00:20:06.000'),
(8, 14, '2026-01-08 00:20:06.000'),
(8, 15, '2026-01-03 15:59:15.089'),
(8, 20, '2026-01-13 14:09:03.000'),
(8, 21, '2026-01-13 14:09:03.000'),
(8, 22, '2026-01-13 14:09:03.000'),
(8, 28, '2026-01-14 10:43:00.219'),
(9, 1, '2026-01-08 00:20:06.000'),
(9, 6, '2026-01-03 15:59:15.089'),
(9, 7, '2026-01-08 00:20:06.000'),
(9, 8, '2026-01-08 00:20:06.000'),
(9, 12, '2026-01-08 00:20:06.000'),
(9, 15, '2026-01-08 00:20:06.000'),
(9, 23, '2026-01-13 14:09:03.000'),
(9, 24, '2026-01-13 14:09:03.000'),
(9, 25, '2026-01-13 14:09:03.000'),
(10, 1, '2026-01-08 00:20:06.000'),
(10, 6, '2026-01-03 15:59:15.089'),
(10, 7, '2026-01-08 00:20:06.000'),
(10, 8, '2026-01-08 00:20:06.000'),
(10, 9, '2026-01-08 00:20:06.000'),
(10, 13, '2026-01-08 00:20:06.000'),
(11, 6, '2026-01-08 00:20:06.000'),
(11, 8, '2026-01-08 00:20:06.000'),
(11, 9, '2026-01-08 00:20:06.000'),
(11, 10, '2026-01-08 00:20:06.000'),
(12, 1, '2026-01-08 00:20:06.000'),
(12, 6, '2026-01-08 00:20:06.000'),
(12, 9, '2026-01-08 00:20:06.000'),
(12, 11, '2026-01-08 00:20:06.000'),
(13, 1, '2026-01-08 00:20:06.000'),
(13, 7, '2026-01-08 00:20:06.000'),
(13, 8, '2026-01-08 00:20:06.000'),
(13, 12, '2026-01-08 00:20:06.000'),
(14, 6, '2026-01-08 00:20:06.000'),
(14, 9, '2026-01-08 00:20:06.000'),
(14, 11, '2026-01-08 00:20:06.000'),
(14, 13, '2026-01-08 00:20:06.000'),
(15, 1, '2026-01-08 00:20:06.000'),
(15, 6, '2026-01-08 00:20:06.000'),
(15, 7, '2026-01-08 00:20:06.000'),
(15, 9, '2026-01-08 00:20:06.000'),
(16, 6, '2026-01-08 00:20:06.000'),
(16, 10, '2026-01-08 00:20:06.000'),
(16, 12, '2026-01-08 00:20:06.000'),
(16, 15, '2026-01-08 00:20:06.000'),
(28, 8, '2026-01-14 10:36:38.449'),
(28, 32, '2026-01-14 10:29:55.300');

-- --------------------------------------------------------

--
-- Table structure for table `FriendRequest`
--

CREATE TABLE `FriendRequest` (
  `id` int(11) NOT NULL,
  `fromUserId` int(11) NOT NULL,
  `toUserId` int(11) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `FriendRequest`
--

INSERT INTO `FriendRequest` (`id`, `fromUserId`, `toUserId`, `status`, `createdAt`) VALUES
(1, 8, 6, 'ACCEPTED', '2026-01-02 15:56:39.930'),
(5, 7, 6, 'ACCEPTED', '2026-01-03 15:43:54.843'),
(6, 6, 1, 'ACCEPTED', '2026-01-03 16:09:51.215'),
(7, 1, 6, 'ACCEPTED', '2026-01-03 16:09:59.314'),
(8, 6, 15, 'PENDING', '2026-01-07 15:09:37.987'),
(9, 11, 12, 'PENDING', '2026-01-08 00:20:06.000'),
(10, 13, 16, 'PENDING', '2026-01-08 00:20:06.000'),
(11, 14, 1, 'PENDING', '2026-01-08 00:20:06.000');

-- --------------------------------------------------------

--
-- Table structure for table `Friendship`
--

CREATE TABLE `Friendship` (
  `userAId` int(11) NOT NULL,
  `userBId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Friendship`
--

INSERT INTO `Friendship` (`userAId`, `userBId`, `createdAt`) VALUES
(1, 6, '2026-01-03 16:10:25.390'),
(6, 7, '2026-01-07 12:57:59.090'),
(6, 8, '2026-01-02 15:58:30.105'),
(6, 9, '2026-01-03 15:59:15.097'),
(6, 10, '2026-01-08 00:20:06.000'),
(6, 11, '2026-01-08 00:20:06.000'),
(6, 12, '2026-01-03 15:59:15.097'),
(6, 13, '2026-01-08 00:20:06.000'),
(6, 14, '2026-01-08 00:20:06.000'),
(7, 8, '2026-01-08 00:20:06.000'),
(7, 9, '2026-01-08 00:20:06.000'),
(7, 10, '2026-01-08 00:20:06.000'),
(8, 9, '2026-01-08 00:20:06.000'),
(8, 10, '2026-01-08 00:20:06.000'),
(8, 12, '2026-01-08 00:20:06.000'),
(8, 15, '2026-01-03 15:59:15.097'),
(9, 10, '2026-01-08 00:20:06.000'),
(9, 11, '2026-01-08 00:20:06.000'),
(9, 13, '2026-01-08 00:20:06.000'),
(10, 11, '2026-01-03 15:59:15.097'),
(10, 12, '2026-01-08 00:20:06.000'),
(10, 14, '2026-01-08 00:20:06.000'),
(11, 13, '2026-01-08 00:20:06.000'),
(11, 15, '2026-01-08 00:20:06.000'),
(12, 15, '2026-01-08 00:20:06.000'),
(12, 16, '2026-01-08 00:20:06.000'),
(13, 14, '2026-01-08 00:20:06.000'),
(13, 15, '2026-01-08 00:20:06.000'),
(14, 15, '2026-01-08 00:20:06.000'),
(14, 16, '2026-01-08 00:20:06.000'),
(15, 16, '2026-01-08 00:20:06.000');

-- --------------------------------------------------------

--
-- Table structure for table `Group`
--

CREATE TABLE `Group` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `ownerId` int(11) NOT NULL,
  `privacy` enum('PUBLIC','PRIVATE','SECRET') NOT NULL DEFAULT 'PUBLIC'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Group`
--

INSERT INTO `Group` (`id`, `name`, `description`, `createdAt`, `ownerId`, `privacy`) VALUES
(1, 'groupe test', 'un groupe de test', '2026-01-05 10:48:01.347', 6, 'PUBLIC'),
(2, 'Groupe Public', 'Visible par tous', '2026-01-05 12:10:00.000', 6, 'PUBLIC'),
(3, 'Groupe Privé', 'Seulement membres', '2026-01-05 12:10:00.000', 6, 'PRIVATE'),
(4, 'Groupe Secret', 'Invisible sans invitation', '2026-01-05 12:10:00.000', 6, 'SECRET'),
(5, 'temp', NULL, '2026-01-05 11:57:24.139', 6, 'PUBLIC'),
(6, 'g private', NULL, '2026-01-07 09:18:21.093', 6, 'PRIVATE'),
(7, 'g secret', NULL, '2026-01-07 09:18:48.514', 6, 'SECRET'),
(8, 'test pour dev', NULL, '2026-01-07 11:33:53.326', 1, 'PUBLIC'),
(9, 'testtttt', NULL, '2026-01-07 11:37:41.556', 1, 'PRIVATE'),
(10, 'test', NULL, '2026-01-07 22:41:11.830', 6, 'PUBLIC'),
(11, 'st pub', NULL, '2026-01-13 22:09:58.000', 8, 'PUBLIC');

-- --------------------------------------------------------

--
-- Table structure for table `GroupInvite`
--

CREATE TABLE `GroupInvite` (
  `id` int(11) NOT NULL,
  `groupId` int(11) NOT NULL,
  `fromUserId` int(11) NOT NULL,
  `toUserId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `GroupInviteLink`
--

CREATE TABLE `GroupInviteLink` (
  `id` int(11) NOT NULL,
  `token` varchar(191) NOT NULL,
  `groupId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `expiresAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `GroupInviteLink`
--

INSERT INTO `GroupInviteLink` (`id`, `token`, `groupId`, `createdAt`, `expiresAt`) VALUES
(1, 'TEST_TOKEN_SECRET', 3, '2026-01-05 12:55:34.000', NULL),
(2, '4f37de3117d3a9a6a7ee8e9d4eaaa74fdc8037474a17c438', 3, '2026-01-05 11:56:21.070', NULL),
(3, '1d4169d333ba86c032333e95556cbe879691b0d5dbecf838', 3, '2026-01-05 11:56:27.551', NULL),
(4, '173c02f765db459afbb439867b7fd53ddcf32c22ac90f2ef', 3, '2026-01-05 11:56:29.544', NULL),
(5, '6652d3c94f7e01c3ff8bc9c2bc72919986fd5ad5f5e36a3c', 1, '2026-01-07 09:09:29.244', NULL),
(6, '3a9e17661361ab4ff088f3ed4a8f2533e6beb8c45a903f3f', 9, '2026-01-07 11:37:43.897', NULL),
(7, '47167099708fbfe807afcddc1a80379ef398a12d3e2924c3', 1, '2026-01-07 15:06:14.706', NULL),
(8, '3cdec6c0444385cad5ee618e1fc0c13c9bebe2b5cf1a2642', 10, '2026-01-07 22:41:26.637', NULL),
(9, '6cf3b9bad2da5084997d4be324006422c23fb33464d668f9', 10, '2026-01-07 22:56:10.267', NULL),
(10, '8df9764e52fd28c2862e4399df27bb4a221707cd89bea4b0', 11, '2026-01-13 22:10:04.000', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `GroupMember`
--

CREATE TABLE `GroupMember` (
  `groupId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'MEMBER',
  `joinedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `GroupMember`
--

INSERT INTO `GroupMember` (`groupId`, `userId`, `role`, `joinedAt`) VALUES
(1, 1, 'MEMBER', '2026-01-07 09:10:18.730'),
(1, 6, 'OWNER', '2026-01-05 10:48:01.347'),
(2, 6, 'OWNER', '2026-01-05 12:13:11.000'),
(2, 8, 'MEMBER', '2026-01-05 12:13:11.000'),
(3, 6, 'OWNER', '2026-01-05 12:13:11.000'),
(5, 6, 'OWNER', '2026-01-05 11:57:24.139'),
(6, 6, 'OWNER', '2026-01-07 09:18:21.093'),
(6, 8, 'MEMBER', '2026-01-14 01:51:22.000'),
(7, 6, 'OWNER', '2026-01-07 09:18:48.514'),
(8, 1, 'OWNER', '2026-01-07 11:33:53.326'),
(8, 6, 'MEMBER', '2026-01-07 11:34:00.751'),
(8, 7, 'MEMBER', '2026-01-07 15:05:41.442'),
(9, 1, 'OWNER', '2026-01-07 11:37:41.556'),
(9, 6, 'MEMBER', '2026-01-07 11:37:50.505'),
(10, 6, 'OWNER', '2026-01-07 22:41:11.830'),
(10, 7, 'MEMBER', '2026-01-07 22:57:47.151'),
(11, 8, 'OWNER', '2026-01-13 22:09:58.000'),
(11, 28, 'MEMBER', '2026-01-14 11:23:32.000');

-- --------------------------------------------------------

--
-- Table structure for table `Interest`
--

CREATE TABLE `Interest` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Interest`
--

INSERT INTO `Interest` (`id`, `name`) VALUES
(74, 'Action'),
(208, 'Activisme'),
(178, 'Afrique'),
(158, 'Agriculture'),
(177, 'Amérique'),
(79, 'Animation'),
(154, 'Animaux'),
(240, 'Animaux exotiques'),
(71, 'Anime'),
(281, 'Antiquités'),
(159, 'Apiculture'),
(244, 'Aquarelle'),
(94, 'Architecture'),
(103, 'Art contemporain'),
(28, 'Arts martiaux'),
(175, 'Asie'),
(216, 'Associations'),
(269, 'Astrologie'),
(116, 'Astronomie'),
(163, 'Aventure'),
(161, 'Backpacking'),
(36, 'Badminton'),
(96, 'Bande dessinée'),
(31, 'Baseball'),
(13, 'Basketball'),
(65, 'Batterie'),
(133, 'Battle royale'),
(172, 'BBQ'),
(185, 'Beauté'),
(141, 'Belote'),
(215, 'Bénévolat'),
(168, 'Bière'),
(157, 'Bio'),
(119, 'Biologie'),
(109, 'Blockchain'),
(232, 'Blogging'),
(51, 'Blues'),
(272, 'Bouddhisme'),
(27, 'Boxe'),
(204, 'Bricolage'),
(243, 'Calligraphie'),
(148, 'Camping'),
(4, 'ch.isep'),
(66, 'Chant'),
(283, 'Chasse au trésor'),
(234, 'Chats'),
(8, 'cheese'),
(239, 'Chevaux'),
(235, 'Chiens'),
(118, 'Chimie'),
(5, 'ciel'),
(86, 'Cinéma d\'auteur'),
(45, 'Classique'),
(114, 'Cloud computing'),
(169, 'Cocktails'),
(10, 'coding'),
(187, 'Coiffure'),
(280, 'Collections'),
(73, 'Comédies'),
(98, 'Comics'),
(250, 'Communication'),
(61, 'Concerts'),
(279, 'Conventions'),
(278, 'Cosplay'),
(50, 'Country'),
(205, 'Couture'),
(207, 'Crochet'),
(264, 'Cross-fit'),
(110, 'Crypto'),
(170, 'Cuisine'),
(164, 'Cultures du monde'),
(107, 'Cybersécurité'),
(18, 'Cyclisme'),
(29, 'Danse'),
(112, 'Data science'),
(81, 'DC Comics'),
(202, 'Décoration'),
(251, 'Design'),
(88, 'Dessin'),
(192, 'Développement personnel'),
(273, 'Développement spirituel'),
(115, 'DevOps'),
(261, 'Diététique'),
(203, 'DIY'),
(191, 'DIY mode'),
(67, 'DJ'),
(72, 'Documentaires'),
(211, 'Droits humains'),
(58, 'Dubstep'),
(40, 'E-sport'),
(139, 'Échecs'),
(143, 'Écologie'),
(213, 'Économie'),
(197, 'Écriture'),
(46, 'Électro'),
(122, 'Électronique'),
(214, 'Entrepreneuriat'),
(38, 'Équitation'),
(22, 'Escalade'),
(274, 'Ésotérisme'),
(176, 'Europe'),
(276, 'Fantasy'),
(209, 'Féminisme'),
(62, 'Festivals'),
(3, 'fifa'),
(69, 'Films'),
(255, 'Finance'),
(20, 'Fitness'),
(1, 'football'),
(151, 'Forêt'),
(33, 'Formule 1'),
(224, 'Formule E'),
(131, 'FPS'),
(55, 'Funk'),
(166, 'Gastronomie'),
(253, 'Gestion de projet'),
(30, 'Golf'),
(63, 'Guitare'),
(35, 'Handball'),
(83, 'Harry Potter'),
(43, 'Hip-hop'),
(101, 'Histoire'),
(32, 'Hockey'),
(76, 'Horreur'),
(57, 'House'),
(256, 'Immobilier'),
(123, 'Impression 3D'),
(49, 'Indie'),
(136, 'Indies games'),
(121, 'Ingénierie'),
(106, 'Intelligence artificielle'),
(257, 'Investissement'),
(111, 'IoT'),
(60, 'J-pop'),
(174, 'Japon'),
(146, 'Jardinage'),
(44, 'Jazz'),
(138, 'Jeux de société'),
(124, 'Jeux vidéo'),
(198, 'Journaling'),
(217, 'Justice sociale'),
(59, 'K-pop'),
(165, 'Langues'),
(254, 'Leadership'),
(196, 'Lecture'),
(247, 'Lego'),
(210, 'LGBTQ+'),
(99, 'Littérature'),
(184, 'Luxe'),
(113, 'Machine learning'),
(97, 'Manga'),
(246, 'Maquettes'),
(186, 'Maquillage'),
(249, 'Marketing'),
(80, 'Marvel'),
(120, 'Mathématiques'),
(223, 'Mécanique'),
(266, 'Médecines alternatives'),
(193, 'Méditation'),
(271, 'Méditation spirituelle'),
(150, 'Mer'),
(48, 'Metal'),
(194, 'Mindfulness'),
(200, 'Minimalisme'),
(132, 'MOBA'),
(129, 'Mobile gaming'),
(180, 'Mode'),
(245, 'Modélisme'),
(149, 'Montagne'),
(34, 'MotoGP'),
(219, 'Motos'),
(9, 'movies'),
(263, 'Musculation'),
(91, 'Musées'),
(7, 'music'),
(17, 'Natation'),
(267, 'Naturopathie'),
(85, 'Netflix'),
(127, 'Nintendo'),
(260, 'Nutrition'),
(179, 'Océanie'),
(237, 'Oiseaux'),
(2, 'om'),
(93, 'Opéra'),
(201, 'Organisation'),
(242, 'Origami'),
(153, 'Ornithologie'),
(275, 'Paranormal'),
(188, 'Parfums'),
(171, 'Pâtisserie'),
(128, 'PC gaming'),
(87, 'Peinture'),
(145, 'Permaculture'),
(39, 'Pétanque'),
(102, 'Philosophie'),
(90, 'Photographie'),
(152, 'Photographie nature'),
(117, 'Physique'),
(64, 'Piano'),
(190, 'Piercings'),
(265, 'Pilates'),
(37, 'Ping-pong'),
(125, 'PlayStation'),
(226, 'Podcasts'),
(100, 'Poésie'),
(238, 'Poissons'),
(140, 'Poker'),
(212, 'Politique'),
(42, 'Pop'),
(68, 'Production musicale'),
(199, 'Productivité'),
(104, 'Programmation'),
(195, 'Psychologie'),
(248, 'Puzzles'),
(54, 'R&B'),
(227, 'Radio'),
(147, 'Randonnée'),
(47, 'Rap'),
(52, 'Reggae'),
(236, 'Reptiles'),
(137, 'Rétrogaming'),
(162, 'Road trip'),
(108, 'Robotique'),
(41, 'Rock'),
(78, 'Romance'),
(130, 'RPG'),
(15, 'Rugby'),
(19, 'Running'),
(75, 'Science-fiction'),
(241, 'Scrapbooking'),
(89, 'Sculpture'),
(70, 'Séries TV'),
(134, 'Simulation'),
(26, 'Skateboard'),
(23, 'Ski'),
(183, 'Sneakers'),
(24, 'Snowboard'),
(53, 'Soul'),
(268, 'Spiritualité'),
(262, 'Sport santé'),
(225, 'Stand-up'),
(82, 'Star Wars'),
(259, 'Startups'),
(277, 'Steampunk'),
(135, 'Stratégie'),
(231, 'Streaming'),
(95, 'Street art'),
(173, 'Street food'),
(181, 'Streetwear'),
(84, 'Studio Ghibli'),
(25, 'Surf'),
(142, 'Tarot'),
(189, 'Tatouages'),
(6, 'tech'),
(56, 'Techno'),
(14, 'Tennis'),
(92, 'Théâtre'),
(77, 'Thriller'),
(230, 'TikTok'),
(258, 'Trading'),
(11, 'travel'),
(206, 'Tricot'),
(222, 'Tuning'),
(229, 'Twitch'),
(252, 'UX/UI'),
(155, 'Véganisme'),
(156, 'Végétarisme'),
(220, 'Vélos'),
(282, 'Vide-greniers'),
(167, 'Vin'),
(182, 'Vintage'),
(233, 'Vlogging'),
(218, 'Voitures'),
(221, 'Voitures anciennes'),
(16, 'Volleyball'),
(160, 'Voyages'),
(105, 'Web dev'),
(126, 'Xbox'),
(21, 'Yoga'),
(228, 'YouTube'),
(144, 'Zéro déchet');

-- --------------------------------------------------------

--
-- Table structure for table `Like`
--

CREATE TABLE `Like` (
  `userId` int(11) NOT NULL,
  `postId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Like`
--

INSERT INTO `Like` (`userId`, `postId`, `createdAt`) VALUES
(1, 1, '2025-12-31 15:46:12.599'),
(1, 20, '2026-01-03 16:23:36.440'),
(1, 26, '2026-01-07 09:39:03.908'),
(6, 5, '2026-01-08 14:54:25.172'),
(6, 8, '2026-01-03 15:59:15.154'),
(6, 9, '2026-01-03 15:59:15.154'),
(6, 20, '2026-01-03 16:23:27.077'),
(6, 21, '2026-01-03 16:08:22.953'),
(6, 30, '2026-01-13 16:36:52.871'),
(6, 32, '2026-01-14 00:16:57.271'),
(6, 34, '2026-01-14 01:51:43.351'),
(7, 26, '2026-01-08 14:53:35.713'),
(7, 30, '2026-01-13 16:43:14.885'),
(8, 2, '2026-01-14 00:35:46.861'),
(8, 3, '2026-01-03 15:32:38.557'),
(8, 4, '2026-01-02 16:49:04.994'),
(8, 6, '2026-01-03 16:00:52.400'),
(8, 7, '2026-01-14 00:35:42.651'),
(8, 18, '2026-01-03 15:59:15.154'),
(8, 22, '2026-01-14 00:36:00.621'),
(8, 24, '2026-01-14 01:59:37.276'),
(8, 29, '2026-01-14 00:35:33.468'),
(8, 35, '2026-01-14 01:57:05.266'),
(9, 12, '2026-01-03 15:59:15.154'),
(10, 8, '2026-01-03 15:59:15.154'),
(15, 12, '2026-01-03 15:59:15.154');

-- --------------------------------------------------------

--
-- Table structure for table `Message`
--

CREATE TABLE `Message` (
  `id` int(11) NOT NULL,
  `content` text NOT NULL,
  `conversationId` int(11) NOT NULL,
  `senderId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Message`
--

INSERT INTO `Message` (`id`, `content`, `conversationId`, `senderId`, `createdAt`) VALUES
(1, 'test', 1, 6, '2026-01-07 16:01:07.566'),
(2, 'test', 1, 6, '2026-01-07 16:01:28.914'),
(3, 'testss', 1, 6, '2026-01-07 16:02:26.400'),
(4, 'essai', 1, 7, '2026-01-07 16:02:38.887'),
(5, 'try', 1, 7, '2026-01-07 16:02:52.717'),
(6, 'dddd', 1, 7, '2026-01-07 16:03:12.798'),
(7, 'ssss', 1, 7, '2026-01-07 16:03:14.948'),
(8, 'test', 1, 7, '2026-01-07 21:44:41.011'),
(9, 'try', 1, 7, '2026-01-07 21:44:46.521'),
(10, 'encore', 1, 7, '2026-01-07 21:44:49.904'),
(11, 'test', 1, 6, '2026-01-07 22:11:38.291'),
(12, 'sdsd', 1, 6, '2026-01-08 14:54:51.140'),
(13, 'sds', 1, 6, '2026-01-08 14:54:54.161'),
(14, 'test', 2, 6, '2026-01-13 13:30:41.581'),
(15, 'test', 4, 8, '2026-01-14 10:48:17.000'),
(16, 'try', 4, 8, '2026-01-14 10:48:49.000'),
(17, 'essai', 4, 28, '2026-01-14 11:24:18.000'),
(18, 'ttt', 4, 28, '2026-01-14 11:24:32.000'),
(19, 'Et la ?', 4, 28, '2026-01-14 12:14:25.000');

-- --------------------------------------------------------

--
-- Table structure for table `Notification`
--

CREATE TABLE `Notification` (
  `id` int(11) NOT NULL,
  `type` enum('LIKE','COMMENT','FRIEND_REQUEST','FRIEND_ACCEPTED','FOLLOW','GROUP_INVITE','GROUP_JOIN','EVENT_CREATED','EVENT_RSVP') NOT NULL,
  `toUserId` int(11) NOT NULL,
  `fromUserId` int(11) DEFAULT NULL,
  `postId` int(11) DEFAULT NULL,
  `commentId` int(11) DEFAULT NULL,
  `friendRequestId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `readAt` datetime(3) DEFAULT NULL,
  `eventId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Notification`
--

INSERT INTO `Notification` (`id`, `type`, `toUserId`, `fromUserId`, `postId`, `commentId`, `friendRequestId`, `createdAt`, `readAt`, `eventId`) VALUES
(1, 'LIKE', 6, 8, 3, NULL, NULL, '2026-01-03 15:32:38.732', '2026-01-03 16:23:01.796', NULL),
(2, 'COMMENT', 6, 8, 7, 10, NULL, '2026-01-03 15:32:44.609', '2026-01-03 16:23:01.796', NULL),
(4, 'LIKE', 8, 6, 21, NULL, NULL, '2026-01-03 16:08:23.139', '2026-01-13 23:11:30.000', NULL),
(5, 'COMMENT', 8, 6, 21, 11, NULL, '2026-01-03 16:09:08.006', '2026-01-13 23:11:30.000', NULL),
(9, 'LIKE', 6, 1, 20, NULL, NULL, '2026-01-03 16:21:20.938', '2026-01-03 16:23:01.796', NULL),
(11, 'LIKE', 6, 1, 20, NULL, NULL, '2026-01-03 16:23:13.635', '2026-01-07 09:08:37.218', NULL),
(12, 'LIKE', 6, 1, 20, NULL, NULL, '2026-01-03 16:23:36.577', '2026-01-07 09:08:37.218', NULL),
(13, 'GROUP_JOIN', 6, 1, NULL, NULL, NULL, '2026-01-07 09:10:18.919', '2026-01-07 11:32:47.175', NULL),
(14, 'COMMENT', 6, 1, NULL, NULL, NULL, '2026-01-07 09:20:13.274', '2026-01-07 11:32:47.175', NULL),
(15, 'LIKE', 6, 1, 26, NULL, NULL, '2026-01-07 09:39:04.503', '2026-01-07 11:32:47.175', NULL),
(16, 'EVENT_CREATED', 1, 6, NULL, NULL, NULL, '2026-01-07 09:47:50.029', NULL, 2),
(17, 'EVENT_RSVP', 6, 1, NULL, NULL, NULL, '2026-01-07 09:48:00.748', '2026-01-07 11:32:47.175', 2),
(18, 'EVENT_CREATED', 1, 6, NULL, NULL, NULL, '2026-01-07 09:49:58.294', NULL, 3),
(19, 'EVENT_RSVP', 6, 1, NULL, NULL, NULL, '2026-01-07 09:50:05.883', '2026-01-07 11:32:47.175', 3),
(20, 'EVENT_RSVP', 6, 1, NULL, NULL, NULL, '2026-01-07 09:50:16.684', '2026-01-07 11:32:47.175', 3),
(21, 'EVENT_RSVP', 6, 1, NULL, NULL, NULL, '2026-01-07 09:50:30.829', '2026-01-07 11:32:47.175', 3),
(22, 'EVENT_RSVP', 6, 1, NULL, NULL, NULL, '2026-01-07 10:50:40.746', '2026-01-07 11:32:47.175', 1),
(23, 'EVENT_RSVP', 6, 1, NULL, NULL, NULL, '2026-01-07 10:50:47.282', '2026-01-07 11:32:47.175', 1),
(24, 'EVENT_RSVP', 6, 1, NULL, NULL, NULL, '2026-01-07 11:14:15.056', '2026-01-07 11:32:47.175', 1),
(25, 'EVENT_RSVP', 6, 1, NULL, NULL, NULL, '2026-01-07 11:14:26.433', '2026-01-07 11:32:47.175', 3),
(26, 'EVENT_RSVP', 6, 1, NULL, NULL, NULL, '2026-01-07 11:32:52.541', '2026-01-07 15:10:05.662', 2),
(27, 'EVENT_RSVP', 6, 1, NULL, NULL, NULL, '2026-01-07 11:33:28.941', '2026-01-07 15:10:05.662', 2),
(28, 'EVENT_CREATED', 1, 6, NULL, NULL, NULL, '2026-01-07 11:35:49.770', NULL, 4),
(29, 'EVENT_CREATED', 6, 1, NULL, NULL, NULL, '2026-01-07 11:36:33.280', '2026-01-07 15:10:05.662', 5),
(30, 'GROUP_JOIN', 1, 6, NULL, NULL, NULL, '2026-01-07 11:37:50.664', NULL, NULL),
(31, 'LIKE', 1, 6, 27, NULL, NULL, '2026-01-07 11:40:48.149', NULL, NULL),
(32, 'COMMENT', 1, 6, 27, 13, NULL, '2026-01-07 11:41:10.560', NULL, NULL),
(33, 'EVENT_CREATED', 6, 1, NULL, NULL, NULL, '2026-01-07 11:43:26.223', '2026-01-07 15:10:05.662', 6),
(34, 'EVENT_CREATED', 1, 6, NULL, NULL, NULL, '2026-01-07 11:50:58.312', NULL, 8),
(35, 'EVENT_CREATED', 6, 1, NULL, NULL, NULL, '2026-01-07 12:03:42.129', '2026-01-07 15:10:05.662', 9),
(37, 'LIKE', 6, 7, 28, NULL, NULL, '2026-01-07 15:04:25.516', '2026-01-07 15:10:05.662', NULL),
(38, 'GROUP_JOIN', 1, 7, NULL, NULL, NULL, '2026-01-07 15:05:41.968', NULL, NULL),
(39, 'EVENT_RSVP', 6, 7, NULL, NULL, NULL, '2026-01-07 15:05:55.665', '2026-01-07 15:10:05.662', 4),
(41, 'GROUP_INVITE', 7, 6, NULL, NULL, NULL, '2026-01-07 22:57:24.909', NULL, NULL),
(42, 'GROUP_JOIN', 6, 7, NULL, NULL, NULL, '2026-01-07 22:57:47.511', '2026-01-08 09:21:31.714', NULL),
(43, 'LIKE', 6, 7, 26, NULL, NULL, '2026-01-08 14:53:35.753', NULL, NULL),
(44, 'LIKE', 7, 6, 5, NULL, NULL, '2026-01-08 14:54:25.214', NULL, NULL),
(45, 'FOLLOW', 8, 6, NULL, NULL, NULL, '2026-01-13 11:27:11.153', '2026-01-13 23:11:30.000', NULL),
(46, 'FOLLOW', 7, 6, NULL, NULL, NULL, '2026-01-13 11:27:15.519', NULL, NULL),
(47, 'FOLLOW', 1, 6, NULL, NULL, NULL, '2026-01-13 11:36:05.161', NULL, NULL),
(48, 'FOLLOW', 18, 6, NULL, NULL, NULL, '2026-01-13 13:09:29.193', NULL, NULL),
(49, 'EVENT_RSVP', 6, 7, NULL, NULL, NULL, '2026-01-13 16:26:57.133', NULL, 8),
(50, 'EVENT_RSVP', 6, 7, NULL, NULL, NULL, '2026-01-13 16:27:07.162', NULL, 8),
(51, 'EVENT_RSVP', 6, 7, NULL, NULL, NULL, '2026-01-13 16:27:13.891', NULL, 8),
(52, 'EVENT_RSVP', 6, 7, NULL, NULL, NULL, '2026-01-13 16:32:22.843', NULL, 8),
(53, 'EVENT_RSVP', 6, 7, NULL, NULL, NULL, '2026-01-13 16:32:29.597', NULL, 8),
(54, 'LIKE', 7, 6, 30, NULL, NULL, '2026-01-13 16:35:08.210', NULL, NULL),
(55, 'EVENT_CREATED', 1, 6, NULL, NULL, NULL, '2026-01-13 16:35:47.871', NULL, 10),
(56, 'EVENT_CREATED', 7, 6, NULL, NULL, NULL, '2026-01-13 16:35:47.948', NULL, 10),
(57, 'LIKE', 7, 6, 30, NULL, NULL, '2026-01-13 16:36:52.909', NULL, NULL),
(58, 'FOLLOW', 12, 8, NULL, NULL, NULL, '2026-01-13 22:48:13.000', NULL, NULL),
(59, 'LIKE', 7, 6, 32, NULL, NULL, '2026-01-14 00:16:57.000', NULL, NULL),
(60, 'COMMENT', 7, 6, 5, 15, NULL, '2026-01-14 01:50:36.000', NULL, NULL),
(61, 'GROUP_INVITE', 8, 6, NULL, NULL, NULL, '2026-01-14 01:51:14.000', NULL, NULL),
(62, 'LIKE', 8, 6, 34, NULL, NULL, '2026-01-14 01:51:43.000', NULL, NULL),
(63, 'LIKE', 6, 8, 24, NULL, NULL, '2026-01-14 01:59:37.000', NULL, NULL),
(64, 'FOLLOW', 32, 28, NULL, NULL, NULL, '2026-01-14 10:29:55.000', NULL, NULL),
(65, 'FOLLOW', 8, 28, NULL, NULL, NULL, '2026-01-14 10:36:38.000', NULL, NULL),
(66, 'FOLLOW', 28, 8, NULL, NULL, NULL, '2026-01-14 10:43:00.000', NULL, NULL),
(67, 'GROUP_JOIN', 8, 28, NULL, NULL, NULL, '2026-01-14 11:23:33.000', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `Post`
--

CREATE TABLE `Post` (
  `id` int(11) NOT NULL,
  `content` text NOT NULL,
  `imageUrl` varchar(255) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `authorId` int(11) NOT NULL,
  `visibility` enum('PUBLIC','FOLLOWERS','FRIENDS','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
  `groupId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Post`
--

INSERT INTO `Post` (`id`, `content`, `imageUrl`, `createdAt`, `authorId`, `visibility`, `groupId`) VALUES
(1, 'test', NULL, '2025-12-31 15:46:07.122', 1, 'PUBLIC', NULL),
(2, 'test followers', NULL, '2026-01-02 13:40:13.742', 6, 'FOLLOWERS', NULL),
(3, 'test friend', NULL, '2026-01-02 14:11:18.303', 6, 'PUBLIC', NULL),
(4, 'test public', NULL, '2026-01-02 15:50:02.721', 6, 'PUBLIC', NULL),
(5, 'temp', NULL, '2026-01-02 15:50:40.426', 7, 'PUBLIC', NULL),
(6, 'test friend', NULL, '2026-01-02 15:59:13.663', 8, 'FRIENDS', NULL),
(7, 'mtn ils sont amis', NULL, '2026-01-02 16:01:39.006', 6, 'FRIENDS', NULL),
(8, 'Alice PUBLIC: concert ce soir 🎶', NULL, '2026-01-03 13:59:15.110', 9, 'PUBLIC', NULL),
(9, 'Alice FOLLOWERS: dev tips #1', NULL, '2026-01-03 14:59:15.110', 9, 'FOLLOWERS', NULL),
(10, 'Alice FRIENDS: raclette chez moi 😄', NULL, '2026-01-03 15:29:15.110', 9, 'FRIENDS', NULL),
(11, 'Alice PRIVATE: note perso (ne doit pas apparaître)', NULL, '2026-01-03 15:49:15.110', 9, 'PRIVATE', NULL),
(12, 'Bob PUBLIC: match ce week-end ⚽', NULL, '2026-01-03 12:59:15.110', 10, 'PUBLIC', NULL),
(13, 'Bob FOLLOWERS: je bosse sur TSN', NULL, '2026-01-03 14:29:15.110', 10, 'FOLLOWERS', NULL),
(14, 'Bob FRIENDS: sortie ciné 🍿', NULL, '2026-01-03 15:14:15.110', 10, 'FRIENDS', NULL),
(15, 'Carol PUBLIC: film 추천 (movies)', NULL, '2026-01-03 11:59:15.110', 11, 'PUBLIC', NULL),
(16, 'Dave FRIENDS: training football', NULL, '2026-01-03 14:49:15.110', 12, 'FRIENDS', NULL),
(17, 'Emma FOLLOWERS: nouveau morceau 🎵', NULL, '2026-01-03 15:34:15.110', 13, 'FOLLOWERS', NULL),
(18, 'Gina PUBLIC: Ciel a encore fait une connerie 😼', NULL, '2026-01-03 15:44:15.110', 15, 'PUBLIC', NULL),
(19, 'Gina FRIENDS: event ch.isep soon 🧀', NULL, '2026-01-03 15:54:15.110', 15, 'FRIENDS', NULL),
(20, 'test', NULL, '2026-01-03 16:05:16.669', 6, 'PUBLIC', NULL),
(21, 'test', NULL, '2026-01-03 16:07:22.261', 8, 'PUBLIC', NULL),
(22, 'on va faire une raclette', NULL, '2026-01-05 10:48:51.653', 6, 'PUBLIC', 1),
(23, 'Post groupe PUBLIC', NULL, '2026-01-05 12:13:34.000', 6, 'PUBLIC', 1),
(24, 'Post groupe PRIVE', NULL, '2026-01-05 12:13:34.000', 6, 'PUBLIC', 2),
(25, 'Post groupe SECRET', NULL, '2026-01-05 12:13:34.000', 6, 'PUBLIC', 3),
(26, 'test pub g test', NULL, '2026-01-07 09:19:56.894', 6, 'PUBLIC', 1),
(27, 'yes', NULL, '2026-01-07 11:40:44.559', 1, 'PUBLIC', 9),
(28, 'test feed djib', NULL, '2026-01-07 15:01:24.484', 6, 'PUBLIC', NULL),
(29, 'TEST', NULL, '2026-01-13 10:15:18.063', 6, 'PUBLIC', NULL),
(30, 'hello vous', NULL, '2026-01-13 16:28:53.008', 7, 'PUBLIC', 8),
(31, 'test', NULL, '2026-01-13 16:37:26.039', 7, 'PUBLIC', 8),
(32, 'test', NULL, '2026-01-13 16:40:36.925', 7, 'PUBLIC', NULL),
(33, 'new', NULL, '2026-01-14 01:49:12.000', 8, 'PUBLIC', NULL),
(34, 'test', NULL, '2026-01-14 01:51:37.000', 8, 'PUBLIC', 6),
(35, 'Pitié', NULL, '2026-01-14 01:51:53.000', 6, 'PUBLIC', 6),
(36, 'bjr', NULL, '2026-01-14 07:48:47.000', 6, 'PUBLIC', NULL),
(37, 'ouhahhh', '/public/uploads/1768386336208-4393-Capture d\'Ã©cran 2025-12-30 130034.png', '2026-01-14 11:25:36.000', 28, 'PUBLIC', NULL),
(38, 'test', '/uploads/1768386868548-4064-Capture d\'Ã©cran 2025-12-30 125211.png', '2026-01-14 11:34:28.000', 28, 'PUBLIC', NULL),
(39, 'nnnn', '/uploads/1768387024198-2047-Capture d\'Ã©cran 2025-12-31 161500.png', '2026-01-14 11:37:04.000', 28, 'PUBLIC', NULL),
(40, 'jhezgihfer', '/uploads/1768387547155-678-Capture d\'Ã©cran 2025-12-31 161500.png', '2026-01-14 11:45:46.000', 28, 'PUBLIC', NULL),
(41, 'gggg', '/uploads/1768387735477-9288-Capturedcran2025-12-31154810.png', '2026-01-14 11:48:55.000', 28, 'PUBLIC', NULL),
(42, 'ytry', '/uploads/1768916451405-5848-profil.jpg', '2026-01-20 14:40:51.000', 6, 'PUBLIC', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `User`
--

CREATE TABLE `User` (
  `id` int(11) NOT NULL,
  `email` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `displayName` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `avatar` varchar(500) DEFAULT NULL,
  `banner` varchar(500) DEFAULT NULL,
  `bio` varchar(500) DEFAULT NULL,
  `dateOfBirth` datetime(3) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `website` varchar(200) DEFAULT NULL,
  `isEmailVerified` tinyint(1) DEFAULT 0,
  `emailVerificationToken` varchar(64) DEFAULT NULL,
  `emailVerificationExpiresAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `User`
--

INSERT INTO `User` (`id`, `email`, `passwordHash`, `displayName`, `createdAt`, `avatar`, `banner`, `bio`, `dateOfBirth`, `location`, `website`, `isEmailVerified`, `emailVerificationToken`, `emailVerificationExpiresAt`) VALUES
(1, 'dev', '$2b$12$i/RExYGMG47RlJFM.i70ke80T4I/HwNC9fwkENY2Z5rBd7XqlYSXS', 'dev', '2025-12-31 15:45:58.476', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
(6, 'dev_test1@mail.com', '$2b$12$c2EjFGOxvKu3d6DeGpo5veAxDe6Y3djdoscwrjyFcEtdZt41bNwcG', 'dev1', '2026-01-02 12:35:59.381', '/uploads/avatar-1768917678317-730202736.jpg', '/public/uploads/banner-1768917258560-577048695.webp', 'je parle de moiiii', '2026-01-14 01:00:00.000', 'Paris', 'https://combiens.fr', 1, NULL, NULL),
(7, 'dev_test2@mail.com', '$2b$12$y1aMjfb16M80gLIbj1sf..Fbyxk3aLaGxjTHAPLu.GVRGpi5sWRSq', 'dev2', '2026-01-02 12:36:25.497', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
(8, 'dev_test3@mail.com', '$2b$12$D/O7dgMH/5euazWA4dvOJeVlX3TYvnuzRmA16emPYEV5Bf04vkij2', 'dev3', '2026-01-02 12:36:57.530', NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL),
(9, 'alice@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Alice', '2026-01-03 15:59:14.943', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
(10, 'bob@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Bob', '2026-01-03 15:59:14.943', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
(11, 'carol@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Carol', '2026-01-03 15:59:14.943', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
(12, 'dave@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Dave', '2026-01-03 15:59:14.943', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
(13, 'emma@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Emma', '2026-01-03 15:59:14.943', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
(14, 'frank@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Frank', '2026-01-03 15:59:14.943', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
(15, 'gina@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Gina', '2026-01-03 15:59:14.943', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
(16, 'henry@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Henry', '2026-01-03 15:59:14.943', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
(17, 'iris@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Iris', '2026-01-13 14:05:13.000', NULL, NULL, 'Passionnée par le football et la musique', NULL, 'Lyon', NULL, 0, NULL, NULL),
(18, 'jack@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Jack', '2026-01-13 14:05:13.000', NULL, NULL, 'Développeur passionné', NULL, 'Toulouse', NULL, 0, NULL, NULL),
(19, 'karen@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Karen', '2026-01-13 14:05:13.000', NULL, NULL, 'Amatrice de voyage', NULL, 'Bordeaux', NULL, 0, NULL, NULL),
(20, 'leo@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Leo', '2026-01-13 14:05:13.000', NULL, NULL, 'Cinéphile et musicien', NULL, 'Marseille', NULL, 0, NULL, NULL),
(21, 'maya@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Maya', '2026-01-13 14:05:13.000', NULL, NULL, 'Geek et passionnée de tech', NULL, 'Lyon', NULL, 0, NULL, NULL),
(22, 'noah@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Noah', '2026-01-13 14:05:13.000', NULL, NULL, 'Joueur de FIFA professionnel', NULL, 'Paris', NULL, 0, NULL, NULL),
(23, 'olivia@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Olivia', '2026-01-13 14:05:13.000', NULL, NULL, 'Amie de ch.isep', NULL, 'Issy-les-Moulineaux', NULL, 0, NULL, NULL),
(24, 'paul@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Paul', '2026-01-13 14:05:13.000', NULL, NULL, 'Développeur web full-stack', NULL, 'Paris', NULL, 0, NULL, NULL),
(25, 'quinn@mail.com', '$2b$12$Q1aFqfLxwqBf8aYJ4mY7Oe0v3mOqfS.2dQxq7ZpXv0B2o4gqgYv3S', 'Quinn', '2026-01-13 14:05:13.000', NULL, NULL, 'Passionné de fromage et de voyage', NULL, 'Suisse', NULL, 0, NULL, NULL),
(28, 'plekibyelila@gmail.com', '$2b$12$mA2TvjwTYXWqtrkisMuG3enN6R4l.ShMrNahkANlaIa0QmTFK7Ok6', 'plekiby', '2026-01-14 09:38:21.000', '/uploads/avatar-1768917979095-499573749.jpg', '/uploads/banner-1768917986079-27090374.webp', 'yes', NULL, NULL, NULL, 1, NULL, NULL),
(29, 'test@test.fr', '$2b$12$ZtWbGAU40bxjKQfYYP1EG.7pesB9KDmITWpJ6lR53PmM/DxkIbP4.', 'test', '2026-01-14 09:50:31.000', NULL, NULL, NULL, NULL, NULL, NULL, 0, '27083a40babb612775724b185f2cf5ca', '2026-01-15 09:50:31'),
(30, 'test@testtest.fr', '$2b$12$Lg7GOejCIb1gDQZrE8zYS.5poFfWoSARqgnceJkK4Bi5ZtCdRWnHK', 'test', '2026-01-14 09:57:11.000', NULL, NULL, NULL, NULL, NULL, NULL, 0, '20a2543561c08d9b42f48c7bcd0f7262', '2026-01-15 09:57:11'),
(31, 'test@teskkkt.fr', '$2b$12$PVFFPy6Gprmkfhb5xDXkDOsOLWzAgtNQVi.4fkNb0LMJp.prVvDpK', 'testtt', '2026-01-14 10:01:05.000', NULL, NULL, NULL, NULL, NULL, NULL, 0, '4d1ca1b7006f48689b3714e97eb99e09', '2026-01-15 10:01:17'),
(32, 'gammeeur@gmail.com', '$2b$12$hpdVJIefzu.FNvdxOPOM5.cLoYOy9toB7oID7ohpuZRxpbadMuYRu', 'test', '2026-01-14 10:05:25.000', NULL, NULL, NULL, NULL, NULL, NULL, 0, '33ddd0de73a746f96f355a6fa0fde7f5', '2026-01-15 10:11:51');

-- --------------------------------------------------------

--
-- Table structure for table `UserBlock`
--

CREATE TABLE `UserBlock` (
  `blockerId` int(11) NOT NULL,
  `blockedId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `UserInterest`
--

CREATE TABLE `UserInterest` (
  `userId` int(11) NOT NULL,
  `interestId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `UserInterest`
--

INSERT INTO `UserInterest` (`userId`, `interestId`) VALUES
(6, 1),
(6, 3),
(6, 4),
(6, 6),
(6, 8),
(6, 9),
(6, 10),
(6, 74),
(7, 8),
(8, 3),
(8, 4),
(8, 5),
(8, 8),
(8, 11),
(9, 1),
(9, 8),
(9, 11),
(10, 3),
(10, 6),
(10, 10),
(11, 7),
(11, 9),
(11, 11),
(12, 1),
(12, 3),
(12, 6),
(13, 4),
(13, 7),
(13, 8),
(14, 6),
(14, 9),
(14, 10),
(15, 4),
(15, 5),
(15, 11),
(16, 1),
(16, 2),
(16, 7),
(17, 1),
(17, 7),
(18, 4),
(18, 6),
(18, 10),
(19, 9),
(19, 11),
(20, 7),
(20, 8),
(20, 9),
(21, 6),
(21, 10),
(21, 11),
(22, 1),
(22, 3),
(22, 10),
(23, 1),
(23, 4),
(23, 6),
(24, 6),
(24, 7),
(24, 10),
(25, 8),
(25, 9),
(25, 11),
(28, 3),
(28, 5),
(28, 8),
(28, 74);

-- --------------------------------------------------------

--
-- Table structure for table `UserMute`
--

CREATE TABLE `UserMute` (
  `muterId` int(11) NOT NULL,
  `mutedId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `UserPrivacy`
--

CREATE TABLE `UserPrivacy` (
  `userId` int(11) NOT NULL,
  `profileVisibility` enum('PUBLIC','FOLLOWERS','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
  `canReceiveMessages` tinyint(1) NOT NULL DEFAULT 1,
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `UserPrivacy`
--

INSERT INTO `UserPrivacy` (`userId`, `profileVisibility`, `canReceiveMessages`, `updatedAt`) VALUES
(6, 'PUBLIC', 0, '2026-01-13 13:36:31.324'),
(7, 'PRIVATE', 0, '2026-01-13 13:29:52.505'),
(28, 'PUBLIC', 0, '0000-00-00 00:00:00.000');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Comment`
--
ALTER TABLE `Comment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Comment_postId_createdAt_idx` (`postId`,`createdAt`),
  ADD KEY `Comment_userId_createdAt_idx` (`userId`,`createdAt`);

--
-- Indexes for table `Conversation`
--
ALTER TABLE `Conversation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Conversation_groupId_idx` (`groupId`);

--
-- Indexes for table `ConversationMember`
--
ALTER TABLE `ConversationMember`
  ADD PRIMARY KEY (`conversationId`,`userId`),
  ADD KEY `ConversationMember_userId_idx` (`userId`);

--
-- Indexes for table `Event`
--
ALTER TABLE `Event`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Event_groupId_startAt_idx` (`groupId`,`startAt`),
  ADD KEY `Event_creatorId_createdAt_idx` (`creatorId`,`createdAt`);

--
-- Indexes for table `EventAttendee`
--
ALTER TABLE `EventAttendee`
  ADD PRIMARY KEY (`eventId`,`userId`),
  ADD KEY `EventAttendee_userId_joinedAt_idx` (`userId`,`joinedAt`);

--
-- Indexes for table `Follow`
--
ALTER TABLE `Follow`
  ADD PRIMARY KEY (`followerId`,`followedId`),
  ADD KEY `Follow_followedId_idx` (`followedId`);

--
-- Indexes for table `FriendRequest`
--
ALTER TABLE `FriendRequest`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `FriendRequest_fromUserId_toUserId_key` (`fromUserId`,`toUserId`),
  ADD KEY `FriendRequest_toUserId_status_idx` (`toUserId`,`status`);

--
-- Indexes for table `Friendship`
--
ALTER TABLE `Friendship`
  ADD PRIMARY KEY (`userAId`,`userBId`),
  ADD KEY `Friendship_userBId_idx` (`userBId`);

--
-- Indexes for table `Group`
--
ALTER TABLE `Group`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Group_ownerId_createdAt_idx` (`ownerId`,`createdAt`);

--
-- Indexes for table `GroupInvite`
--
ALTER TABLE `GroupInvite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `GroupInvite_groupId_toUserId_key` (`groupId`,`toUserId`),
  ADD KEY `GroupInvite_fromUserId_fkey` (`fromUserId`),
  ADD KEY `GroupInvite_toUserId_fkey` (`toUserId`);

--
-- Indexes for table `GroupInviteLink`
--
ALTER TABLE `GroupInviteLink`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `GroupInviteLink_token_key` (`token`),
  ADD KEY `GroupInviteLink_groupId_idx` (`groupId`);

--
-- Indexes for table `GroupMember`
--
ALTER TABLE `GroupMember`
  ADD PRIMARY KEY (`groupId`,`userId`),
  ADD KEY `GroupMember_userId_joinedAt_idx` (`userId`,`joinedAt`);

--
-- Indexes for table `Interest`
--
ALTER TABLE `Interest`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Interest_name_key` (`name`);

--
-- Indexes for table `Like`
--
ALTER TABLE `Like`
  ADD PRIMARY KEY (`userId`,`postId`),
  ADD KEY `Like_postId_idx` (`postId`);

--
-- Indexes for table `Message`
--
ALTER TABLE `Message`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Message_conversationId_createdAt_idx` (`conversationId`,`createdAt`),
  ADD KEY `Message_senderId_idx` (`senderId`);

--
-- Indexes for table `Notification`
--
ALTER TABLE `Notification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Notification_toUserId_createdAt_idx` (`toUserId`,`createdAt`),
  ADD KEY `Notification_toUserId_readAt_idx` (`toUserId`,`readAt`),
  ADD KEY `Notification_fromUserId_fkey` (`fromUserId`),
  ADD KEY `Notification_postId_fkey` (`postId`),
  ADD KEY `Notification_commentId_fkey` (`commentId`),
  ADD KEY `Notification_friendRequestId_fkey` (`friendRequestId`),
  ADD KEY `Notification_eventId_fkey` (`eventId`);

--
-- Indexes for table `Post`
--
ALTER TABLE `Post`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Post_authorId_fkey` (`authorId`),
  ADD KEY `Post_groupId_createdAt_idx` (`groupId`,`createdAt`);

--
-- Indexes for table `User`
--
ALTER TABLE `User`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`),
  ADD UNIQUE KEY `emailVerificationToken` (`emailVerificationToken`);

--
-- Indexes for table `UserBlock`
--
ALTER TABLE `UserBlock`
  ADD PRIMARY KEY (`blockerId`,`blockedId`),
  ADD KEY `UserBlock_blockedId_idx` (`blockedId`);

--
-- Indexes for table `UserInterest`
--
ALTER TABLE `UserInterest`
  ADD PRIMARY KEY (`userId`,`interestId`),
  ADD KEY `UserInterest_interestId_idx` (`interestId`);

--
-- Indexes for table `UserMute`
--
ALTER TABLE `UserMute`
  ADD PRIMARY KEY (`muterId`,`mutedId`),
  ADD KEY `UserMute_mutedId_idx` (`mutedId`);

--
-- Indexes for table `UserPrivacy`
--
ALTER TABLE `UserPrivacy`
  ADD PRIMARY KEY (`userId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Comment`
--
ALTER TABLE `Comment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `Conversation`
--
ALTER TABLE `Conversation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `Event`
--
ALTER TABLE `Event`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `FriendRequest`
--
ALTER TABLE `FriendRequest`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `Group`
--
ALTER TABLE `Group`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `GroupInvite`
--
ALTER TABLE `GroupInvite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `GroupInviteLink`
--
ALTER TABLE `GroupInviteLink`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `Interest`
--
ALTER TABLE `Interest`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=284;

--
-- AUTO_INCREMENT for table `Message`
--
ALTER TABLE `Message`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `Notification`
--
ALTER TABLE `Notification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `Post`
--
ALTER TABLE `Post`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `User`
--
ALTER TABLE `User`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Comment`
--
ALTER TABLE `Comment`
  ADD CONSTRAINT `Comment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Conversation`
--
ALTER TABLE `Conversation`
  ADD CONSTRAINT `Conversation_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ConversationMember`
--
ALTER TABLE `ConversationMember`
  ADD CONSTRAINT `ConversationMember_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ConversationMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Event`
--
ALTER TABLE `Event`
  ADD CONSTRAINT `Event_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Event_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `EventAttendee`
--
ALTER TABLE `EventAttendee`
  ADD CONSTRAINT `EventAttendee_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `EventAttendee_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Follow`
--
ALTER TABLE `Follow`
  ADD CONSTRAINT `Follow_followedId_fkey` FOREIGN KEY (`followedId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Follow_followerId_fkey` FOREIGN KEY (`followerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `FriendRequest`
--
ALTER TABLE `FriendRequest`
  ADD CONSTRAINT `FriendRequest_fromUserId_fkey` FOREIGN KEY (`fromUserId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FriendRequest_toUserId_fkey` FOREIGN KEY (`toUserId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Friendship`
--
ALTER TABLE `Friendship`
  ADD CONSTRAINT `Friendship_userAId_fkey` FOREIGN KEY (`userAId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Friendship_userBId_fkey` FOREIGN KEY (`userBId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Group`
--
ALTER TABLE `Group`
  ADD CONSTRAINT `Group_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `GroupInvite`
--
ALTER TABLE `GroupInvite`
  ADD CONSTRAINT `GroupInvite_fromUserId_fkey` FOREIGN KEY (`fromUserId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `GroupInvite_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `GroupInvite_toUserId_fkey` FOREIGN KEY (`toUserId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `GroupInviteLink`
--
ALTER TABLE `GroupInviteLink`
  ADD CONSTRAINT `GroupInviteLink_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `GroupMember`
--
ALTER TABLE `GroupMember`
  ADD CONSTRAINT `GroupMember_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `GroupMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Like`
--
ALTER TABLE `Like`
  ADD CONSTRAINT `Like_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Like_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Message`
--
ALTER TABLE `Message`
  ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Notification`
--
ALTER TABLE `Notification`
  ADD CONSTRAINT `Notification_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `Comment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Notification_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Notification_friendRequestId_fkey` FOREIGN KEY (`friendRequestId`) REFERENCES `FriendRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Notification_fromUserId_fkey` FOREIGN KEY (`fromUserId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Notification_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Notification_toUserId_fkey` FOREIGN KEY (`toUserId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Post`
--
ALTER TABLE `Post`
  ADD CONSTRAINT `Post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Post_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `UserBlock`
--
ALTER TABLE `UserBlock`
  ADD CONSTRAINT `UserBlock_blockedId_fkey` FOREIGN KEY (`blockedId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `UserBlock_blockerId_fkey` FOREIGN KEY (`blockerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `UserInterest`
--
ALTER TABLE `UserInterest`
  ADD CONSTRAINT `UserInterest_interestId_fkey` FOREIGN KEY (`interestId`) REFERENCES `Interest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `UserInterest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `UserMute`
--
ALTER TABLE `UserMute`
  ADD CONSTRAINT `UserMute_mutedId_fkey` FOREIGN KEY (`mutedId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `UserMute_muterId_fkey` FOREIGN KEY (`muterId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `UserPrivacy`
--
ALTER TABLE `UserPrivacy`
  ADD CONSTRAINT `UserPrivacy_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
