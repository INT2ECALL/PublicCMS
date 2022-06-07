package com.publiccms.entities.sys;

// Generated 2016-4-14 10:10:32 by Hibernate Tools 4.3.1

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

import org.hibernate.annotations.DynamicUpdate;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.publiccms.common.generator.annotation.GeneratorColumn;

/**
 * SysUserToken generated by hbm2java
 */
@Entity
@Table(name = "sys_user_token")
@DynamicUpdate
public class SysUserToken implements java.io.Serializable {

    /**
     * 
     */
    private static final long serialVersionUID = 1L;
    /**
     * auth token<p>
     * 授权码
     */
    @GeneratorColumn(title = "授权码")
    private String authToken;
    @GeneratorColumn(title = "站点", condition = true)
    @JsonIgnore
    private short siteId;
    /**
     * user id<p>
     * 用户id
     */
    @GeneratorColumn(title = "用户", condition = true)
    private long userId;
    /**
     * channel<p>
     * 渠道
     */
    @GeneratorColumn(title = "授权渠道", condition = true)
    private String channel;
    /**
     * create date<p>
     * 授权日期
     */
    @GeneratorColumn(title = "授权日期", order = true)
    private Date createDate;
    /**
     * expiry date<p>
     * 过期日期
     */
    @GeneratorColumn(title = "过期日期", order = true)
    private Date expiryDate;
    /**
     * login ip<p>
     * 登录ip
     */
    @GeneratorColumn(title = "登录IP")
    private String loginIp;

    public SysUserToken() {
    }

    public SysUserToken(String authToken, short siteId, long userId, String channel, Date createDate, String loginIp) {
        this.authToken = authToken;
        this.siteId = siteId;
        this.userId = userId;
        this.channel = channel;
        this.createDate = createDate;
        this.loginIp = loginIp;
    }
    
    public SysUserToken(String authToken, short siteId, long userId, String channel, Date createDate, Date expiryDate, String loginIp) {
        this.authToken = authToken;
        this.siteId = siteId;
        this.userId = userId;
        this.channel = channel;
        this.createDate = createDate;
        this.expiryDate = expiryDate;
        this.loginIp = loginIp;
    }

    @Id
    @Column(name = "auth_token", unique = true, nullable = false, length = 40)
    public String getAuthToken() {
        return this.authToken;
    }

    public void setAuthToken(String authToken) {
        this.authToken = authToken;
    }

    @Column(name = "site_id", nullable = false)
    public short getSiteId() {
        return this.siteId;
    }

    public void setSiteId(short siteId) {
        this.siteId = siteId;
    }

    @Column(name = "user_id", nullable = false)
    public long getUserId() {
        return this.userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }

    @Column(name = "channel", nullable = false, length = 50)
    public String getChannel() {
        return this.channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "create_date", nullable = false, length = 19)
    public Date getCreateDate() {
        return this.createDate;
    }

    public void setCreateDate(Date createDate) {
        this.createDate = createDate;
    }

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "expiry_date", length = 19)
    public Date getExpiryDate() {
        return this.expiryDate;
    }

    public void setExpiryDate(Date expiryDate) {
        this.expiryDate = expiryDate;
    }

    @Column(name = "login_ip", nullable = false, length = 130)
    public String getLoginIp() {
        return this.loginIp;
    }

    public void setLoginIp(String loginIp) {
        this.loginIp = loginIp;
    }

}
