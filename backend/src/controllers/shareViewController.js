const bcrypt = require('bcryptjs');
const { Share, User, Progress, Reflection, Goal, ShareView } = require('../models');
const { Op } = require('sequelize');

class ShareViewController {
  // 获取分享数据
  async getShareData(req, res) {
    try {
      const { shareToken } = req.params;
      const { password } = req.body;
      
      const share = await Share.findOne({
        where: { shareToken, isActive: true },
        include: [{
          model: User,
          as: 'user',
          attributes: ['username', 'profile']
        }]
      });
      
      if (!share) {
        return res.status(404).json({ error: '分享不存在或已失效' });
      }
      
      // 检查是否过期
      if (share.expiresAt && new Date() > share.expiresAt) {
        return res.status(410).json({ error: '分享已过期' });
      }
      
      // 检查密码保护
      if (share.shareType === 'password') {
        if (!password) {
          return res.status(401).json({ error: '需要密码', requirePassword: true });
        }
        
        const isValidPassword = await bcrypt.compare(password, share.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: '密码错误' });
        }
      }
      
      // 记录访问
      await this.recordView(share.id, req);
      
      // 获取分享数据
      const shareData = await this.getFilteredData(share);
      
      res.json({
        share: {
          title: share.title,
          description: share.description,
          settings: share.settings,
          owner: share.user,
          createdAt: share.createdAt
        },
        data: shareData
      });
    } catch (error) {
      console.error('获取分享数据失败:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // 检查分享状态（不需要密码）
  async checkShareStatus(req, res) {
    try {
      const { shareToken } = req.params;
      
      const share = await Share.findOne({
        where: { shareToken },
        attributes: ['id', 'title', 'shareType', 'isActive', 'expiresAt'],
        include: [{
          model: User,
          as: 'user',
          attributes: ['username']
        }]
      });
      
      if (!share) {
        return res.status(404).json({ error: '分享不存在' });
      }
      
      if (!share.isActive) {
        return res.status(403).json({ error: '分享已被禁用' });
      }
      
      if (share.expiresAt && new Date() > share.expiresAt) {
        return res.status(410).json({ error: '分享已过期' });
      }
      
      res.json({
        title: share.title,
        owner: share.user.username,
        requirePassword: share.shareType === 'password',
        isActive: share.isActive
      });
    } catch (error) {
      console.error('检查分享状态失败:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // 根据设置过滤数据
  async getFilteredData(share) {
    const { settings } = share;
    const userId = share.userId;
    
    // 根据设置过滤数据
    const whereClause = { userId };
    
    // 日期范围过滤
    if (settings.dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (settings.dateRange) {
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (settings.customStartDate) {
            startDate = new Date(settings.customStartDate);
          }
          break;
      }
      
      if (startDate) {
        whereClause.createdAt = { [Op.gte]: startDate };
        
        // 如果有结束日期
        if (settings.dateRange === 'custom' && settings.customEndDate) {
          const endDate = new Date(settings.customEndDate);
          endDate.setHours(23, 59, 59, 999); // 设置为当天结束
          whereClause.createdAt[Op.lte] = endDate;
        }
      }
    }
    
    const data = {};
    
    // 获取进展数据
    if (settings.showProgress) {
      data.progress = await Progress.findAll({
        where: whereClause,
        order: [['date', 'DESC']],
        limit: 100 // 限制数量
      });
    }
    
    // 获取反思数据
    if (settings.showReflections) {
      data.reflections = await Reflection.findAll({
        where: whereClause,
        order: [['date', 'DESC']],
        limit: 50 // 限制数量
      });
    }
    
    // 获取目标数据
    if (settings.showGoals) {
      data.goals = await Goal.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: 20 // 限制数量
      });
    }
    
    return data;
  }
  
  // 记录访问
  async recordView(shareId, req) {
    try {
      await ShareView.create({
        shareId,
        viewerIp: req.ip || req.connection.remoteAddress,
        viewerUserAgent: req.get('User-Agent')
      });
      
      // 更新访问计数
      await Share.increment('viewCount', { where: { id: shareId } });
    } catch (error) {
      console.error('记录访问失败:', error);
      // 不抛出错误，避免影响主要功能
    }
  }
}

module.exports = new ShareViewController();
