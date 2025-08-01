const { sequelize, User, Share, ShareView } = require('../src/models');

describe('Share Models', () => {
  beforeAll(async () => {
    // 确保数据库连接正常
    await sequelize.authenticate();
    // 同步所有模型
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // 清理数据，注意顺序（先删除有外键的表）
    await ShareView.destroy({ where: {}, force: true });
    await Share.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('Share Model', () => {
    test('should create a share with default settings', async () => {
      // 创建用户
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      // 创建分享
      const share = await Share.create({
        userId: user.id,
        shareToken: 'test-token-123',
        title: '我的学习进展'
      });

      expect(share.id).toBeDefined();
      expect(share.userId).toBe(user.id);
      expect(share.shareToken).toBe('test-token-123');
      expect(share.title).toBe('我的学习进展');
      expect(share.shareType).toBe('private');
      expect(share.isActive).toBe(true);
      expect(share.viewCount).toBe(0);
      expect(share.settings).toEqual({
        showProgress: true,
        showReflections: true,
        showGoals: true,
        showPersonalInfo: false,
        dateRange: 'all',
        customStartDate: null,
        customEndDate: null
      });
    });

    test('should create a password-protected share', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      const share = await Share.create({
        userId: user.id,
        shareToken: 'password-token-123',
        title: '密码保护的分享',
        shareType: 'password',
        password: 'encrypted-password'
      });

      expect(share.shareType).toBe('password');
      expect(share.password).toBe('encrypted-password');
    });

    test('should have association with User', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      const share = await Share.create({
        userId: user.id,
        shareToken: 'association-token',
        title: '关联测试'
      });

      const shareWithUser = await Share.findByPk(share.id, {
        include: [{ model: User, as: 'user' }]
      });

      expect(shareWithUser.user).toBeDefined();
      expect(shareWithUser.user.username).toBe('testuser');
    });
  });

  describe('ShareView Model', () => {
    test('should create a share view record', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      const share = await Share.create({
        userId: user.id,
        shareToken: 'view-token-123',
        title: '访问测试'
      });

      const shareView = await ShareView.create({
        shareId: share.id,
        viewerIp: '192.168.1.1',
        viewerUserAgent: 'Mozilla/5.0 Test Browser'
      });

      expect(shareView.id).toBeDefined();
      expect(shareView.shareId).toBe(share.id);
      expect(shareView.viewerIp).toBe('192.168.1.1');
      expect(shareView.viewerUserAgent).toBe('Mozilla/5.0 Test Browser');
      expect(shareView.viewedAt).toBeDefined();
    });

    test('should have association with Share', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      const share = await Share.create({
        userId: user.id,
        shareToken: 'association-view-token',
        title: '关联访问测试'
      });

      const shareView = await ShareView.create({
        shareId: share.id,
        viewerIp: '192.168.1.1'
      });

      const viewWithShare = await ShareView.findByPk(shareView.id, {
        include: [{ model: Share, as: 'share' }]
      });

      expect(viewWithShare.share).toBeDefined();
      expect(viewWithShare.share.title).toBe('关联访问测试');
    });
  });

  describe('Model Associations', () => {
    test('should get all shares for a user', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      await Share.create({
        userId: user.id,
        shareToken: 'token-1',
        title: '分享1'
      });

      await Share.create({
        userId: user.id,
        shareToken: 'token-2',
        title: '分享2'
      });

      const userWithShares = await User.findByPk(user.id, {
        include: [{ model: Share, as: 'shares' }]
      });

      expect(userWithShares.shares).toHaveLength(2);
      expect(userWithShares.shares[0].title).toBeDefined();
    });

    test('should get all views for a share', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      const share = await Share.create({
        userId: user.id,
        shareToken: 'views-token',
        title: '访问统计测试'
      });

      await ShareView.create({
        shareId: share.id,
        viewerIp: '192.168.1.1'
      });

      await ShareView.create({
        shareId: share.id,
        viewerIp: '192.168.1.2'
      });

      const shareWithViews = await Share.findByPk(share.id, {
        include: [{ model: ShareView, as: 'views' }]
      });

      expect(shareWithViews.views).toHaveLength(2);
    });
  });
});
