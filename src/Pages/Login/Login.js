import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, adminLogout, resetPassword } from '../../api/services/authService';
import {
  LockOutlined,
  MailOutlined,
  LoadingOutlined,
  WarningOutlined,
  EyeInvisibleOutlined,CheckCircleOutlined,
  EyeTwoTone,
  UserOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { getMetals } from '../../api/services/metalService';
import { getProducts } from '../../api/services/productService';
import { getSubProducts } from '../../api/services/subProductServices';
import {
  Form,
  Input,
  Button,
  Checkbox,
  Card,
  Row,
  Col,
  Typography,
  Alert,
  Divider,
  ConfigProvider,
  theme,
  Space,
  Tooltip,
  Modal
} from 'antd';
import Swal from 'sweetalert2';
import { roots } from '../../colorConstant';

import authImage from '../../assets/auth.avif'
import { getRoleById } from '../../api/services/roleService';

const { Title, Text } = Typography;

const ResetPasswordModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (values) => {
    console.log('Form values:', values);
    if (loading) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Call your reset password API with correct parameters
      const result = await resetPassword({
        username: values.username,
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      });
      
      console.log('API Response:', result);

      // Show success message in Alert
      setSuccess('Your password has been reset successfully.');

      // Call onSuccess callback after a short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        form.resetFields();
        onCancel();
      }, 2000);

    } catch (err) {
      console.error('Reset password error:', err);
      
      // Get the actual error message from the response
      const errorMessage = err?.response?.data?.message 
        || err?.message 
        || 'Failed to reset password. Please check your current password and try again.';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setError('');
    setSuccess('');
    onCancel();
  };

  return (
    <Modal
      title="Reset Password"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      centered
      styles={{
        body: {
          padding: '24px 0',
        }
      }}
    >
      {/* Success Alert */}
      {success && (
        <Alert
          message={success}
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{
            marginBottom: 24,
            borderRadius: 8,
            border: `1px solid ${roots.status.success.light}`,
            background: roots.status.success.lighter
          }}
        />
      )}

      {/* Error Alert */}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{
            marginBottom: 24,
            borderRadius: 8,
            border: `1px solid ${roots.status.error.light}`,
            background: roots.status.error.lighter
          }}
          closable
          onClose={() => setError('')}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="large"
        disabled={loading || success}
      >
        <Form.Item
          name="username"
          label="Username"
          rules={[
            {
              required: true,
              message: 'Please enter your username'
            }
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: roots.text.tertiary }} />}
            placeholder="Enter your username"
            disabled={loading || success}
          />
        </Form.Item>

        <Form.Item
          name="oldPassword"
          label="Current Password"
          rules={[
            {
              required: true,
              message: 'Please enter your current password'
            }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: roots.text.tertiary }} />}
            placeholder="Enter current password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            disabled={loading || success}
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[
            {
              required: true,
              message: 'Please enter your new password'
            },
            {
              min: 6,
              message: 'Password must be at least 6 characters'
            }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: roots.text.tertiary }} />}
            placeholder="Enter new password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            disabled={loading || success}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm New Password"
          dependencies={['newPassword']}
          rules={[
            {
              required: true,
              message: 'Please confirm your new password'
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: roots.text.tertiary }} />}
            placeholder="Confirm new password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            disabled={loading || success}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            disabled={success}
            style={{
              height: 48,
              fontWeight: 600,
              borderRadius: 8,
              background: loading ? roots.gold[400] : roots.gradient.gold,
              border: 'none',
            }}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const Login = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const onFinish = async (values) => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const user = await adminLogin(values);

      const role = await getRoleById(user.role);
      if (!role) {
        throw new Error('User role not found.');
      }

      if (isMounted) {
        const roleName = role.name?.toLowerCase();

        const currUserData = {
          username: user.username,
          email: user.email,
        }

        localStorage.setItem('userId', user.id);
        localStorage.setItem('userRole', roleName ? roleName : user.role);
        localStorage.setItem('userRoleId', user.role);
        localStorage.setItem('userBranchId', user.branch_id);
        localStorage.setItem('currUserData', JSON.stringify(currUserData));

        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: 'Redirecting to dashboard...',
          timer: 1500,
          showConfirmButton: false,
          background: roots.background.paper,
          color: roots.text.primary,
          confirmButtonColor: roots.gold[500]
        });

        window.location.reload();
        navigate('/dashboard');
      }
    } catch (err) {
      if (isMounted) {
        const errorMessage =
          err?.response?.data?.message || err.message || 'An unexpected error occurred';
        setError(errorMessage);

        await Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: errorMessage,
          background: roots.background.paper,
          color: roots.text.primary,
          confirmButtonColor: roots.gold[500]
        });
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  const showResetModal = () => {
    setResetModalVisible(true);
  };

  const handleResetSuccess = () => {
    setResetModalVisible(false);
  };

  const handleResetCancel = () => {
    setResetModalVisible(false);
  };

  return (
    <ConfigProvider
      style={{
        margin: 0,
      }}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: roots.gold[500],
          colorBgContainer: roots.background.paper,
          colorText: roots.text.primary,
          colorBorder: roots.ebony[300],
          borderRadius: 8,
          fontSize: 16,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Button: {
            colorPrimary: roots.gold[500],
            colorPrimaryHover: roots.gold[600],
            colorPrimaryActive: roots.gold[700],
            borderRadius: 8,
            fontWeight: 500,
            controlHeight: 48,
            fontSize: 16,
          },
          Input: {
            colorBorder: roots.ebony[300],
            hoverBorderColor: roots.gold[400],
            activeBorderColor: roots.gold[500],
            borderRadius: 8,
            controlHeight: 48,
            fontSize: 16,
            paddingInline: 16,
          },
          Checkbox: {
            colorPrimary: roots.gold[500],
          },
          Card: {
            borderRadiusLG: 16,
          },
          Alert: {
            borderRadius: 8,
          },
          Form: {
            labelColor: roots.text.primary,
            labelFontWeight: 500,
          }
        }
      }}
    >
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${authImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: "cover",
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>

        <Row justify="center" style={{ width: '100%', maxWidth: 480, zIndex: 1 }}>
          <Col span={24}>
            <div style={{
              background: roots.background.paper,
              borderRadius: 20,
              padding: '48px 40px',
              boxShadow: roots.shadow.xl,
              border: `1px solid ${roots.ebony[200]}`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Card header decoration */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: roots.gradient.gold,
              }} />

              {/* Logo and header section */}
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div style={{

                }}>
                  <img
                    src={require('../../assets/logo.jpg')}
                    alt="Logo"
                    style={{
                      width: 300,
                      height: 100
                    }}
                  />
                </div>

              </div>

              {/* Security badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
                padding: '12px 20px',
                background: roots.ebony[50],
                borderRadius: 24,
                border: `1px solid ${roots.ebony[200]}`
              }}>
                <SafetyCertificateOutlined style={{
                  color: roots.status.success.main,
                  marginRight: 8,
                  fontSize: 16
                }} />
                <Text style={{
                  color: roots.text.secondary,
                  fontSize: 14,
                  fontWeight: 500
                }}>
                  Secure Admin Access
                </Text>
              </div>

              {error && (
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  icon={<WarningOutlined />}
                  style={{
                    marginBottom: 24,
                    borderRadius: 8,
                    border: `1px solid ${roots.status.error.light}`,
                    background: roots.status.error.lighter
                  }}
                  closable
                  onClose={() => setError('')}
                />
              )}

              <Form
                form={form}
                name="login"
                initialValues={{ remember: rememberMe }}
                onFinish={onFinish}
                layout="vertical"
                size="large"
                style={{ width: '100%' }}
              >
                <Form.Item
                  name="email"
                  label={
                    <Text style={{
                      color: roots.text.primary,
                      fontWeight: 500,
                      fontSize: 14
                    }}>
                      Username
                    </Text>
                  }
                  rules={[
                    {
                      required: true,
                      message: 'Please enter your username'
                    }
                  ]}
                  style={{ marginBottom: 24 }}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: roots.text.tertiary }} />}
                    placeholder="Enter your username"
                    style={{
                      background: roots.background.paper,
                      transition: roots.transition.normal
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={
                    <Text style={{
                      color: roots.text.primary,
                      fontWeight: 500,
                      fontSize: 14
                    }}>
                      Password
                    </Text>
                  }
                  rules={[
                    {
                      required: true,
                      message: 'Please enter your password'
                    },
                    {
                      min: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  ]}
                  style={{ marginBottom: 24 }}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: roots.text.tertiary }} />}
                    placeholder="Enter your password"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    style={{
                      background: roots.background.paper,
                      transition: roots.transition.normal
                    }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 32 }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Form.Item name="remember" valuePropName="checked" noStyle>
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          style={{
                            color: roots.text.secondary,
                            fontWeight: 400
                          }}
                        >
                          Remember me
                        </Checkbox>
                      </Form.Item>
                    </Col>
                    <Col>
                      <Tooltip title="Reset your password">
                        <Button
                          type="text"
                          style={{
                            color: roots.gold[500],
                            padding: 0,
                            fontWeight: 500,
                            fontSize: 14
                          }}
                          onClick={showResetModal}
                        >
                          Forgot password?
                        </Button>
                      </Tooltip>
                    </Col>
                  </Row>
                </Form.Item>

                <Form.Item style={{ marginBottom: 32 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                    style={{
                      height: 52,
                      fontWeight: 600,
                      fontSize: 16,
                      borderRadius: 12,
                      background: loading ? roots.gold[400] : roots.gradient.gold,
                      border: 'none',
                      boxShadow: loading ? 'none' : roots.shadow.gold,
                      transition: roots.transition.normal
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = roots.shadow.xl;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = roots.shadow.gold;
                      }
                    }}
                  >
                    {loading ? (
                      <Space>
                        <LoadingOutlined />
                        <span>Signing In...</span>
                      </Space>
                    ) : (
                      <Space>
                        <UserOutlined />
                        <span>Sign In to Dashboard</span>
                      </Space>
                    )}
                  </Button>
                </Form.Item>
              </Form>

              <Divider style={{
                borderColor: roots.ebony[200],
                margin: '32px 0 24px 0'
              }} />

              {/* Footer */}
              <div style={{ textAlign: 'center' }}>
                <Text style={{
                  color: roots.text.tertiary,
                  fontSize: 13,
                  fontWeight: 400
                }}>
                  © {new Date().getFullYear()} Amaya Gold Point. All rights reserved.
                </Text>
                <br />
                <Text style={{
                  color: roots.text.tertiary,
                  fontSize: 12,
                  fontWeight: 300,
                  marginTop: 4
                }}>
                  Version 2.0.0 • Secure • Professional
                </Text>
              </div>
            </div>
          </Col>
        </Row>

        {/* Reset Password Modal */}
        <ResetPasswordModal
          visible={resetModalVisible}
          onCancel={handleResetCancel}
          onSuccess={handleResetSuccess}
        />
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        .main-content {
         margin: 0;
         padding: 0;
      }
        
        .ant-input:focus,
        .ant-input-focused {
          box-shadow: 0 0 0 2px ${roots.gold[500]}20;
        }
        
        .ant-input-password:focus,
        .ant-input-password-focused {
          box-shadow: 0 0 0 2px ${roots.gold[500]}20;
        }
        
        .ant-btn-primary:not(:disabled):hover {
          background: ${roots.gradient.gold};
          border-color: ${roots.gold[600]};
        }
      `}</style>
    </ConfigProvider>
  );
};

export default Login;