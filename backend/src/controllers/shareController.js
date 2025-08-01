const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Share, User, ShareView } = require('../models');

class ShareController {
  // 创建分享
  async createShare(req, res) {
    try {
      const { title, description, shareType, password, settings, expiresAt } = req.body;
      
      // 生成唯一的分享令牌
      const shareToken = crypto.randomBytes(32).toString('hex');
      
      // 如果是密码保护，加密密码
      let hashedPassword = null;
      if (shareType === 'password' && password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
      
      const share = await Share.create({
        userId: req.user.id,
        shareToken,
        title,
        description,
        shareType,
        password: hashedPassword,
        settings,
        expiresAt
      });
      
      res.status(201).json({
        ...share.toJSON(),
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${shareToken}`,
        password: undefined // 不返回密码
      });
    } catch (error) {
      console.error('创建分享失败:', error);
      res.status(400).json({ error: error.message });
    }
  }
  
  // 获取我的分享列表
  async getMyShares(req, res) {
    try {
      const shares = await Share.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['password'] }
      });
      
      res.json(shares);
    } catch (error) {
      console.error('获取分享列表失败:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // 获取单个分享详情
  async getShare(req, res) {
    try {
      const { shareId } = req.params;
      
      const share = await Share.findOne({
        where: { id: shareId, userId: req.user.id },
        attributes: { exclude: ['password'] },
        include: [
          {
            model: ShareView,
            as: 'views',
            attributes: ['id', 'viewerIp', 'viewedAt'],
            order: [['viewedAt', 'DESC']],
            limit: 10
          }
        ]
      });
      
      if (!share) {
        return res.status(404).json({ error: '分享不存在' });
      }
      
      res.json({
        ...share.toJSON(),
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${share.shareToken}`
      });
    } catch (error) {
      console.error('获取分享详情失败:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // 更新分享
  async updateShare(req, res) {
    try {
      const { shareId } = req.params;
      const updates = req.body;
      
      // 如果更新密码，需要重新加密
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }
      
      const [updated] = await Share.update(updates, {
        where: { id: shareId, userId: req.user.id }
      });
      
      if (!updated) {
        return res.status(404).json({ error: '分享不存在' });
      }
      
      const share = await Share.findByPk(shareId, {
        attributes: { exclude: ['password'] }
      });
      
      res.json({
        ...share.toJSON(),
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${share.shareToken}`
      });
    } catch (error) {
      console.error('更新分享失败:', error);
      res.status(400).json({ error: error.message });
    }
  }
  
  // 删除分享
  async deleteShare(req, res) {
    try {
      const { shareId } = req.params;
      
      const deleted = await Share.destroy({
        where: { id: shareId, userId: req.user.id }
      });
      
      if (!deleted) {
        return res.status(404).json({ error: '分享不存在' });
      }
      
      res.json({ message: '分享已删除' });
    } catch (error) {
      console.error('删除分享失败:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // 切换分享状态
  async toggleShareStatus(req, res) {
    try {
      const { shareId } = req.params;
      
      const share = await Share.findOne({
        where: { id: shareId, userId: req.user.id }
      });
      
      if (!share) {
        return res.status(404).json({ error: '分享不存在' });
      }
      
      await share.update({ isActive: !share.isActive });
      
      res.json({
        message: share.isActive ? '分享已启用' : '分享已禁用',
        isActive: share.isActive
      });
    } catch (error) {
      console.error('切换分享状态失败:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // 获取分享统计
  async getShareStats(req, res) {
    try {
      const { shareId } = req.params;
      
      const share = await Share.findOne({
        where: { id: shareId, userId: req.user.id },
        include: [
          {
            model: ShareView,
            as: 'views',
            attributes: ['viewedAt']
          }
        ]
      });
      
      if (!share) {
        return res.status(404).json({ error: '分享不存在' });
      }
      
      // 统计访问数据
      const totalViews = share.views.length;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayViews = share.views.filter(view => 
        new Date(view.viewedAt) >= today
      ).length;
      
      const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekViews = share.views.filter(view => 
        new Date(view.viewedAt) >= last7Days
      ).length;
      
      res.json({
        totalViews,
        todayViews,
        weekViews,
        shareCreated: share.createdAt,
        lastViewed: share.views.length > 0 ? share.views[0].viewedAt : null
      });
    } catch (error) {
      console.error('获取分享统计失败:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ShareController();
