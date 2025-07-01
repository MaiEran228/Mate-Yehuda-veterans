import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { PieChart } from '@mui/x-charts/PieChart';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
import { Typography, Box } from '@mui/material';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const DailyDiagrams = () => {
    const [profiles, setProfiles] = useState([]);
    const [attendance, setAttendance] = useState(null);

    // חישוב היום הנוכחי לפי אזור זמן ישראל (שיטה ידנית)
    const now = new Date();
    const israelNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
    // מיפוי ידני של ימי השבוע לעברית
    const daysMap = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const todayIndex = israelNow.getDay(); // 0=ראשון, 1=שני, ...
    const todayName = daysMap[todayIndex];
    const todayDate = israelNow.toISOString().slice(0, 10);

    useEffect(() => {
        // טען פרופילים
        const unsubProfiles = onSnapshot(collection(db, 'profiles'), (snap) => {
            setProfiles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        // טען נוכחות של היום
        const unsubAttendance = onSnapshot(doc(db, 'attendance', todayDate), (snap) => {
            setAttendance(snap.exists() ? snap.data() : null);
        });
        return () => {
            unsubProfiles();
            unsubAttendance();
        };
    }, [todayDate]);

    // סינון פרופילים שאמורים להגיע היום
    const relevantProfiles = profiles.filter(p => Array.isArray(p.arrivalDays) && p.arrivalDays.includes(todayName));
    const relevantNames = relevantProfiles.map(p => p.name);

    // סינון נוכחות רק למי שאמור להגיע (לפי name)
    const attendanceList = attendance?.attendanceList?.filter(a => relevantNames.includes(a.name)) || [];

    // חישוב נכון של הגיעו/לא הגיעו לפי name
    const attended = relevantProfiles.filter(p => {
        const rec = attendanceList.find(a => a.name === p.name);
        return rec && rec.attended === true;
    }).length;

    const absent = relevantProfiles.filter(p => {
        const rec = attendanceList.find(a => a.name === p.name);
        return !rec || rec.attended === false;
    }).length;

    const shouldArrive = relevantProfiles.length;

    // סיבות היעדרות אפשריות
    const absenceReasons = [
        { key: 'מחלה', color: '#90caf9' },
        { key: 'אשפוז', color: '#f48fb1' },
        { key: 'שמחה', color: '#ffd54f' },
        { key: 'אבל', color: '#bcaaa4' },
        { key: 'שיפוי', color: '#a5d6a7' },
        { key: 'טיפול בית', color: '#ce93d8' },
    ];

    // סינון נעדרים עם סיבה
    const absentWithReason = attendanceList.filter(a => a.attended === false && a.reason);
    const totalWithReason = absentWithReason.length;
    const reasonCounts = absenceReasons.map(r => ({
        ...r,
        value: absentWithReason.filter(a => a.reason === r.key).length,
    })).filter(r => r.value > 0);

    // נתונים לגרף עוגה של סיבות היעדרות
    const reasonPieData = reasonCounts.map((r, idx) => ({
        id: idx,
        value: r.value,
        label: '',
        displayLabel: r.key,
        color: r.color,
    }));

    // המקרא של סיבות היעדרות תמיד יוצג, גם אם אין נתונים
    const reasonLegendData = absenceReasons.map((r, idx) => ({
        id: idx,
        value: reasonPieData.find(x => x.displayLabel === r.key)?.value || 0,
        displayLabel: r.key,
        color: r.color,
    }));

    // PieChart data for reasons: אם אין נתונים, עיגול ריק
    const hasReasonData = reasonPieData.length > 0 && totalWithReason > 0;
    const emptyReasonPieData = [
        { id: 0, value: 1, label: '', displayLabel: '', color: '#e5f1f8' },
    ];

    // נתונים לגרף עוגה - בפורמט דומה לגרף מטפל
    const pieData = [
        {
            id: 0,
            value: attended,
            label: '',
            displayLabel: 'הגיעו',
            color: '#A5D6A7',
        },
        {
            id: 1,
            value: absent,
            label: '',
            displayLabel: 'לא הגיעו',
            color: '#FFB3B3',
        },
    ];

    // לוגיקה להצגת עיגול ריק אם אין נתונים
    const hasAttendanceData = attended + absent > 0;
    const emptyAttendancePieData = [
        { id: 0, value: 1, label: '', displayLabel: '', color: '#e5f1f8' },
    ];

    return (
        <Box
            sx={{
                border: '2px solid #b7c9d6',
                borderRadius: 4,
                mt: 4,
                bgcolor: '#ebf1f5',
                maxWidth: 1100,
                mx: 'auto',
                overflow: 'hidden',
                p: 0,
            }}
        >
            <Box sx={{
                bgcolor: 'rgb(220, 228, 232)',
                width: '100%',
                borderTopRightRadius: 4,
                borderTopLeftRadius: 4,
                py: 1.5,
                px: 2,
                mb: 0,
            }}>
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#406370', fontWeight: 700 }}>
                    התפלגויות יומיות
                </Typography>
            </Box>
            <Box sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'flex-start', width: '100%' }}>
                    {/* דיאגרמת נוכחות יומית */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        border: '1.5px solid #b7c9d6',
                        borderRadius: 3,
                        boxShadow: '0 2px 8px rgba(64,99,112,0.07)',
                        p: 2,
                        minWidth: 320,
                        maxWidth: 410,
                        bgcolor: '#f0f4f8',
                    }}>
                        <Typography variant="h7" sx={{ mb: 2, color: '#406370', fontWeight: 600 }}>
                            נוכחות יומית
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, flexWrap: 'nowrap', width: '100%' }}>
                            {/* מקרא */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', minWidth: 130 }}>
                                {pieData.map((item) => (
                                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: item.color, mr: 1, border: '1px solid #ccc' }} />
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {item.displayLabel}: {item.value}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                            {/* עוגת התפלגות */}
                            <PieChart
                                series={[{
                                    data: hasAttendanceData ? pieData.map(item => ({ ...item, label: '' })) : emptyAttendancePieData,
                                    arcLabel: (item) => {
                                        const total = attended + absent;
                                        return hasAttendanceData && total ? `${((item.value / total) * 100).toFixed(1)}%` : '';
                                    },
                                    arcLabelMinAngle: 10,
                                    arcLabelRadius: '80%',
                                }]}
                                width={280}
                                height={220}
                                legend={{ hidden: true }}
                                slots={{ legend: null }}
                                sx={{
                                    [`& .MuiPieArcLabel-root`]: {
                                        fontSize: 14,
                                        fontWeight: 600,
                                    },
                                    '& .MuiChartsLegend-root': { display: 'none !important' },
                                }}
                            />
                        </Box>
                    </Box>
                    {/* דיאגרמת סיבות היעדרות */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        border: '1.5px solid #b7c9d6',
                        borderRadius: 3,
                        boxShadow: '0 2px 8px rgba(64,99,112,0.07)',
                        p: 2,
                        minWidth: 320,
                        maxWidth: 410,
                        bgcolor: '#f0f4f8',
                    }}>
                        <Typography variant="h7" sx={{ mb: 2, color: '#406370', fontWeight: 600 }}>
                            סיבות היעדרות
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, flexWrap: 'nowrap', width: '100%' }}>
                            {/* מקרא */}
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'center',
                                minWidth: 130,
                            }}>
                                {reasonLegendData.map((item) => (
                                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: item.color, mr: 1, border: '1px solid #ccc' }} />
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {item.displayLabel}: {item.value}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                            <PieChart
                                series={[{
                                    data: hasReasonData ? reasonPieData.map(item => ({ ...item, label: '' })) : emptyReasonPieData,
                                    arcLabel: (item) => hasReasonData && totalWithReason ? `${((item.value / totalWithReason) * 100).toFixed(1)}%` : '',
                                    arcLabelMinAngle: 10,
                                    arcLabelRadius: '80%',
                                }]}
                                width={280}
                                height={220}
                                legend={{ hidden: true }}
                                slots={{ legend: null }}
                                sx={{
                                    [`& .MuiPieArcLabel-root`]: {
                                        fontSize: 14,
                                        fontWeight: 600,
                                    },
                                    '& .MuiChartsLegend-root': { display: 'none !important' },
                                }}
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default DailyDiagrams;