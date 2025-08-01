const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const shareViewController = require('../controllers/shareViewController');
const { authMiddleware } = require('../middleware/auth');
const validation = require('../middleware/validation');

// 测试路由
router.get('/test', (req, res) => {
  res.json({ message: 'Share routes working' });
});

// 分享管理路由（需要认证）
// 创建分享
router.post('/manage', authMiddleware, validation.validateShare, (req, res) => {
  shareController.createShare(req, res);
});

// 获取我的分享列表
router.get('/manage', authMiddleware, (req, res) => {
  shareController.getMyShares(req, res);
});

// 获取单个分享详情
router.get('/manage/:shareId', authMiddleware, (req, res) => {
  shareController.getShare(req, res);
});

// 更新分享
router.put('/manage/:shareId', authMiddleware, validation.validateShare, (req, res) => {
  shareController.updateShare(req, res);
});

// 删除分享
router.delete('/manage/:shareId', authMiddleware, (req, res) => {
  shareController.deleteShare(req, res);
});

// 切换分享状态
router.patch('/manage/:shareId/toggle', authMiddleware, (req, res) => {
  shareController.toggleShareStatus(req, res);
});

// 获取分享统计
router.get('/manage/:shareId/stats', authMiddleware, (req, res) => {
  shareController.getShareStats(req, res);
});

// 公开访问路由（不需要认证）
// 检查分享状态
router.get('/:shareToken/status', (req, res) => {
  shareViewController.checkShareStatus(req, res);
});

// 获取分享数据
router.post('/:shareToken', (req, res) => {
  shareViewController.getShareData(req, res);
});

module.exports = router;
