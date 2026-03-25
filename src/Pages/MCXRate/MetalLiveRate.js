import React, { useState, useEffect } from 'react';
import {
    Card, Typography, Spin, Button, Switch, Row, Col,
    Statistic, Progress, Tooltip, Badge, Alert, message
} from 'antd';
import {
    FullscreenOutlined, FullscreenExitOutlined,
    ReloadOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { roots } from '../../colorConstant';
import './MetalLiveRate.css';
import api from '../../api/apiConfig/apiClient';

const { Title, Text } = Typography;

const MetalLiveRate = () => {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [priceChanges, setPriceChanges] = useState({});

    const toNumber = (val, fallback = 0) => {
        const n = Number(val);
        return Number.isFinite(n) ? n : fallback;
    };

    // Fetch metal prices from API
    const fetchMetalPrices = async () => {
        try {
            setLoading(true);
            
            // Get only the live-rates data (last 3 items)
            const liveRatesResponse = await api.get('/live-rates');

            if (liveRatesResponse?.data && liveRatesResponse.data.length > 0) {
                // Take the last 3 items from the response
                const lastThreeItems = liveRatesResponse.data.slice(-3);
                
                // Format the data for display
                const formattedPrices = lastThreeItems
                .filter(item => item.carat !== '22K') // ✅ exclude 22K
                .map(item => ({
                  id: item.id,
                  metal: item.metal_name,
                  carat: item.carat,
                  price: toNumber(item.live_rate),
                  discount: toNumber(item.discount),
                  effective_rate: toNumber(item.live_rate) - toNumber(item.discount),
                  currency: 'INR',
                  metal_name: item.metal_name,
                  live_rate: toNumber(item.live_rate)
                }));
              

                setPrices(formattedPrices);
                setLastUpdated(new Date());

                // Initialize price changes for these metals
                const changes = {};
                formattedPrices.forEach(metal => {
                    const key = `${metal.metal}-${metal.carat || 'default'}`;
                    if (!priceChanges[key]) {
                        changes[key] = {
                            direction: Math.random() > 0.5 ? 'up' : 'down',
                            percentage: (Math.random() * 5).toFixed(2)
                        };
                    }
                });
                setPriceChanges(prev => ({ ...prev, ...changes }));
            } else {
                message.error('No data received from live-rates endpoint');
            }
        } catch (error) {
            console.error("Error fetching metal prices:", error);
            message.error('Failed to fetch metal prices');
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchMetalPrices();
    }, []);

    // Auto-refresh effect - every 12 seconds for API data
    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchMetalPrices();
            }, 12000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh]);

    // Update price changes every second (static simulation)
    useEffect(() => {
        const changeInterval = setInterval(() => {
            setPriceChanges(prevChanges => {
                const updatedChanges = { ...prevChanges };

                Object.keys(updatedChanges).forEach(key => {
                    if (Math.random() < 0.1) {
                        updatedChanges[key].direction =
                            updatedChanges[key].direction === 'up' ? 'down' : 'up';
                    }

                    const currentChange = parseFloat(updatedChanges[key].percentage);
                    const fluctuation = (Math.random() * 0.5) - 0.25;
                    let newChange = currentChange + fluctuation;
                    newChange = Math.max(0.1, Math.min(5, newChange));
                    updatedChanges[key].percentage = newChange.toFixed(2);
                });

                return updatedChanges;
            });
        }, 1000);

        return () => clearInterval(changeInterval);
    }, []);

    // Toggle full screen mode
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    };

    // Handle full screen change events
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, []);

    // Get price change data for a specific metal
    const getPriceChangeData = (metal) => {
        const key = `${metal.metal}-${metal.carat || 'default'}`;
        return priceChanges[key] || { direction: 'stable', percentage: '0.00' };
    };

    // Calculate progress percentage based on current price
    const calculateProgressPercent = (metal) => {
        if (!metal || !metal.price) return 50;

        const price = parseFloat(metal.price);
        // Adjust these values based on your actual price ranges
        const minPrice = 1000;
        const maxPrice = 10000;

        const normalized = ((price - minPrice) / (maxPrice - minPrice)) * 100;
        return Math.min(Math.max(normalized, 10), 90);
    };

    // Get metal icon based on type
    const getMetalIcon = (metalType) => {
        switch (metalType.toLowerCase()) {
            case 'gold': return '🥇';
            case 'silver': return '🥈';
            case 'platinum': return '🔷';
            case 'palladium': return '🔶';
            default: return '💰';
        }
    };

    // Format price with thousands separators
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        }).format(price);
    };

    // Get color based on metal type
    const getMetalColor = (metal) => {
        if (!metal || !metal.metal) return roots.primary;

        const metalType = metal.metal.toLowerCase();
        const carat = metal.carat ? metal.carat.toLowerCase() : '';

        switch (metalType) {
            case 'gold':
                if (carat.includes('22')) return '#D4AF37'; // Gold color for 22K
                if (carat.includes('24')) return '#FFD700'; // Brighter gold for 24K
                return '#FFD700'; // Default gold

            case 'silver':
                return '#C0C0C0'; // Silver color

            case 'platinum':
                return '#E5E4E2';

            case 'palladium':
                return '#CED0DD';

            default:
                return roots.primary;
        }
    };

    // Get display name for metal
    const getMetalDisplayName = (metal) => {
        if (metal.carat) {
            return `${metal.metal} ${metal.carat}`;
        }
        return metal.metal;
    };

    const handleManualRefresh = () => {
        fetchMetalPrices();
    };

    return (
        <div className={`metal-rates-container ${isFullScreen ? 'fullscreen' : ''}`}>
            <div className="metal-rates-header">
                <Title level={isFullScreen ? 1 : 2} className="title">
                    Live Metal Prices
                    <Tooltip title="Real data updates every 12 seconds, price changes update every second. ">
                        <InfoCircleOutlined style={{ marginLeft: 10, fontSize: isFullScreen ? '28px' : '20px' }} />
                    </Tooltip>
                </Title>
                <div className="controls">
                    <Text className="auto-refresh-label" style={{ fontSize: isFullScreen ? '16px' : '14px', color: 'whitesmoke' }}>
                        Auto Refresh
                    </Text>
                    <Switch
                        checked={autoRefresh}
                        onChange={setAutoRefresh}
                        style={{ marginRight: 15, transform: isFullScreen ? 'scale(1.2)' : 'scale(1)' }}
                    />
                    <Button
                        icon={isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                        onClick={toggleFullScreen}
                        style={{
                            marginRight: 10,
                            fontSize: isFullScreen ? '16px' : '14px',
                            height: isFullScreen ? '44px' : '40px'
                        }}
                        size={isFullScreen ? 'large' : 'middle'}
                    >
                        {isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    </Button>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={handleManualRefresh}
                        loading={loading}
                        style={{
                            fontSize: isFullScreen ? '16px' : '14px',
                            height: isFullScreen ? '44px' : '40px'
                        }}
                        size={isFullScreen ? 'large' : 'middle'}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {loading && prices.length === 0 ? (
                <div className="loading-container">
                    <Spin size="large" />
                    <Text style={{ marginTop: 20, display: 'block', fontSize: isFullScreen ? '18px' : '14px' }}>
                        Loading live metal prices...
                    </Text>
                </div>
            ) : (
                <>
                    <Alert
                        message={`Last updated: ${lastUpdated.toLocaleTimeString()}| Price changes update every second`}
                        type="info"
                        showIcon
                        style={{
                            marginBottom: 20,
                            fontSize: isFullScreen ? '16px' : '14px',
                            padding: isFullScreen ? '12px 20px' : '8px 15px'
                        }}
                    />

                    {prices.length === 0 ? (
                        <Alert
                            message="No metal prices available"
                            type="warning"
                            style={{ marginBottom: 20 }}
                        />
                    ) : (
                        <Row gutter={[20, 20]}>
                            {prices.map((metal, index) => {
                                const changeData = getPriceChangeData(metal);
                                const changeClass = `price-change-${changeData.direction}`;
                                const metalColor = getMetalColor(metal);
                                return (
                                    <Col
                                        xs={24} sm={12} lg={8} xl={8}
                                        key={`${metal.metal}-${metal.carat || 'default'}-${index}`}
                                        className="metal-col"
                                    >
                                        <Card
                                            className="metal-card"
                                            style={{
                                                borderLeft: `6px solid ${metalColor}`,
                                                borderRadius: '16px',
                                                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                                            }}
                                            hoverable
                                            bodyStyle={{ padding: isFullScreen ? '24px' : '16px' }}
                                        >
                                            <div className="metal-header">
                                                <span
                                                    className="metal-icon"
                                                    style={{ fontSize: isFullScreen ? '36px' : '28px' }}
                                                >
                                                    {getMetalIcon(metal.metal)}
                                                </span>
                                                <Title
                                                    level={isFullScreen ? 3 : 4}
                                                    className="metal-name"
                                                    style={{ marginBottom: 0, marginLeft: 10 }}
                                                >
                                                    {getMetalDisplayName(metal)}
                                                </Title>
                                                {metal.carat && (
                                                    <Badge
                                                        count={metal.carat}
                                                        style={{
                                                            color: 'white',
                                                            backgroundColor: metalColor,
                                                            fontSize: isFullScreen ? '14px' : '12px',
                                                            height: isFullScreen ? '24px' : '20px',
                                                            padding: isFullScreen ? '0 8px' : '0 6px',
                                                            marginLeft: 10
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            <div style={{ marginTop: 16 }}>
                                                <Statistic
                                                    value={formatPrice(metal.effective_rate)}
                                                    precision={2}
                                                    valueStyle={{
                                                        color: metalColor,
                                                        fontSize: isFullScreen ? '32px' : '24px',
                                                        fontWeight: 'bold'
                                                    }}
                                                    suffix="INR"
                                                    className="metal-price"
                                                />
                                                
                                               
                                               
                                            </div>

                                            <div
                                                className={`price-change ${changeClass}`}
                                                style={{ 
                                                    fontSize: isFullScreen ? '18px' : '14px',
                                                    marginTop: 12,
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {changeData.direction === 'up' && '↗ '}
                                                {changeData.direction === 'down' && '↘ '}
                                                {changeData.direction === 'stable' && '→ '}
                                                {changeData.direction !== 'stable' && `${changeData.percentage}%`}
                                            </div>

                                            <Progress
                                                percent={calculateProgressPercent(metal)}
                                                showInfo={false}
                                                strokeColor={metalColor}
                                                className="price-trend"
                                                strokeWidth={isFullScreen ? 10 : 6}
                                                style={{ marginTop: 16 }}
                                            />

                                            <div className="metal-details" style={{ marginTop: 12 }}>
                                                <Text
                                                    type="secondary"
                                                    style={{ fontSize: isFullScreen ? '14px' : '12px' }}
                                                >
                                                    Per gram • Effective rate after discount
                                                </Text>
                                            </div>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}
                </>
            )}
        </div>
    );
};

export default MetalLiveRate;