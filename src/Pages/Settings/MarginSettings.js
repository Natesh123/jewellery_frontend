import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Typography,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Space,
  Row,
  Col,
  Tag,
  message
} from "antd";
import { EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import api from "../../api/apiConfig/apiClient";
import { getRoles } from "../../api/services/roleService";
import { createMarginSettings, getAllMarginSettings, updateMarginSettingsByRoleId } from "../../api/services/marginSettingsService";

const { Title, Text } = Typography;
const { Option } = Select;

const MarginSettings = () => {
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [settingsData, setSettingsData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const [roleOptions, setRoleOptions] = useState([]);

  // Role options
  // const roleOptions = [
  //   "Office Executive",
  //   "Sales Executive",
  //   "Manager",
  //   "Regional Manager",
  //   "Admin",
  // ];

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await getRoles();
      if (res) {
        setRoleOptions(res.roles);
      } else {
        message.error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      message.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  // Fetch settings from backend
  const fetchMarginSettings = async () => {
    setLoading(true);
    try {
      const res = await getAllMarginSettings();
      if (res?.data) {
        const formattedData = await res.data.map((item) => {
          const matchedRole = roleOptions.find(
            (role) => Number(role.id) === Number(item.role)
          );
          return {
            ...item,
            role_name: matchedRole ? matchedRole.name : "Unknown Role",
          };
        });
        setSettingsData(formattedData);
      } else {
        message.error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      message.error("Failed to load margin settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [])

  useEffect(() => {
    if (roleOptions.length > 0) {
      fetchMarginSettings();
    }
  }, [roleOptions])

  // Open edit modal
  const handleEdit = (record) => {
    setSelectedRole(record);
    form.setFieldsValue({
      min_percent: record.min_percent,
      max_percent: record.max_percent,
    });
    setIsModalVisible(true);
  };

  // Close edit modal
  const handleModalClose = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedRole(null);
  };

  // Close add modal
  const handleAddModalClose = () => {
    setIsAddModalVisible(false);
    addForm.resetFields();
  };

  // Submit updated values
  const handleSubmit = async (values) => {
    if (values.min_percent > values.max_percent) {
      message.error("Minimum percent cannot exceed maximum percent!");
      return;
    }

    try {
      console.log("selected role", selectedRole);

      await updateMarginSettingsByRoleId(selectedRole.role, values);
      message.success(`${selectedRole.role_name} margins updated successfully!`);
      handleModalClose();
      fetchMarginSettings();
    } catch (error) {
      console.error("Update error:", error);
      message.error("Failed to update margin settings.");
    }
  };

  // Add new margin percent for role
  const handleAddMargin = async (values) => {
    console.log("values", values);

    if (values.min_percent > values.max_percent) {
      message.error("Minimum percent cannot exceed maximum percent!");
      return;
    }

    try {
      await createMarginSettings(values);
      // await api.post('/margin-settings',values)
      message.success("New role margin added successfully!");
      handleAddModalClose();
      fetchMarginSettings();
    } catch (error) {
      console.error("Add error:", error);
      message.error("Failed to add new margin setting.");
    }
  };

  // Role color mapping for better visualization
  const roleColors = {
    "Office Executive": "blue",
    "Sales Executive": "purple",
    "Manager": "green",
    "Regional Manager": "orange",
    "Admin": "red",
  };

  const columns = [
    {
      title: "Role",
      dataIndex: "role_name",
      key: "role_name",
      render: (role) => (
        <Tag color={roleColors[role] || "blue"} style={{ fontWeight: "bold" }}>
          {role}
        </Tag>
      ),
    },
    {
      title: "Minimum Margin (%)",
      dataIndex: "min_percent",
      key: "min_percent",
      render: (value) => <Text strong>{value}%</Text>,
    },
    {
      title: "Maximum Margin (%)",
      dataIndex: "max_percent",
      key: "max_percent",
      render: (value) => <Text strong>{value}%</Text>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={12}>
            <Title level={3} style={{ margin: 0 }}>
              Margin Percentage Settings
            </Title>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddModalVisible(true)}
              >
                Add Margin
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchMarginSettings}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="User Role Margin Settings">
        <Table
          columns={columns}
          dataSource={settingsData}
          rowKey="id"
          pagination={false}
          loading={loading}
        />
      </Card>

      {/* 🔹 Edit Modal */}
      <Modal
        title={`Update Margin - ${selectedRole?.role_name || ""}`}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ min_percent: 0, max_percent: 0 }}>
          <Form.Item
            label="Minimum Margin (%)"
            name="min_percent"
            rules={[
              { required: true, message: "Please enter minimum margin!" },
              {
                validator: (_, value) =>
                  value < 0
                    ? Promise.reject("Margin cannot be negative!")
                    : Promise.resolve(),
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} placeholder="Min %" />
          </Form.Item>

          <Form.Item
            label="Maximum Margin (%)"
            name="max_percent"
            rules={[
              { required: true, message: "Please enter maximum margin!" },
              {
                validator: (_, value) =>
                  value < 0
                    ? Promise.reject("Margin cannot be negative!")
                    : Promise.resolve(),
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} placeholder="Max %" />
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={handleModalClose}>Cancel</Button>
              <Button type="primary" htmlType="submit" icon={<EditOutlined />}>
                Update
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 🔸 Add Modal */}
      <Modal
        title="Add Margin Setting"
        open={isAddModalVisible}
        onCancel={handleAddModalClose}
        footer={null}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddMargin}>
          <Form.Item
            label="Select Role"
            name="role_id"
            rules={[{ required: true, message: "Please select a role!" }]}
          >
            <Select placeholder="Choose role">
              {roleOptions.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Minimum Margin (%)"
            name="min_percent"
            rules={[
              {
                required: true,
                type: "number",
                message: "Please enter minimum margin!"
              }
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              precision={2}
              placeholder="Min %"
            />
          </Form.Item>


          <Form.Item
            label="Maximum Margin (%)"
            name="max_percent"
            rules={[
              {
                required: true,
                type: "number",
                message: "Please enter maximum margin!"
              }
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              precision={2}
              placeholder="Max %"
            />
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={handleAddModalClose}>Cancel</Button>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                Add
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MarginSettings;
