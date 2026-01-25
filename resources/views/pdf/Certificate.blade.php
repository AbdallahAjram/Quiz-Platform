<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Helvetica', sans-serif;
            width: 100%;
            height: 100%;
        }

        /* 
           Main container that creates the "Border" user requested.
           Fixed dimensions (270mm x 180mm) for A4 Landscape (297x210)
           Centered using absolute positioning + margin: auto
        */
        .page-border {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            width: 270mm;
            height: 180mm;
            margin: auto;
            border: 5mm solid #B8860B;
            /* Gold Border */
            box-sizing: border-box;
            z-index: -1;
            /* Behind content */
        }

        /* 
           Wrapper for content to align vertically. 
           display: table is the most reliable way to vertically center dynamic content in dompdf 
        */
        .content-wrapper {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            display: table;
            text-align: center;
        }

        .content-cell {
            display: table-cell;
            vertical-align: middle;
            text-align: center;
            width: 100%;
            height: 100%;
        }

        /* Block level elements with explicit margins to prevent overlapping */
        .block-element {
            display: block;
            margin-left: auto;
            margin-right: auto;
            line-height: 1.6;
            /* Requested line height */
        }

        .logo {
            width: 40mm;
            margin-bottom: 20px;
        }

        .cert-title {
            font-size: 36pt;
            font-weight: bold;
            color: #1A365D;
            text-transform: uppercase;
            margin-bottom: 10px;
        }

        .cert-subtitle {
            font-size: 14pt;
            letter-spacing: 4px;
            color: #B8860B;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 30px;
            /* Spacer */
        }

        .presented-text {
            font-size: 12pt;
            color: #555;
            margin-bottom: 5px;
        }

        .student-name {
            font-size: 28pt;
            font-weight: bold;
            color: #000;
            border-bottom: 2px solid #1A365D;
            display: inline-block;
            /* allows border to hug text length */
            padding: 0 40px;
            margin-top: 10px;
            margin-bottom: 25px;
        }

        .course-title {
            font-size: 20pt;
            font-weight: bold;
            color: #1A365D;
            margin-top: 10px;
            margin-bottom: 40px;
            /* Space before footer */
        }

        .footer-table {
            width: 80%;
            margin: 0 auto;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }

        .footer-item {
            font-size: 11pt;
            color: #444;
            line-height: 1.5;
        }

        .verification {
            font-size: 9pt;
            color: #888;
            margin-top: 15px;
        }
    </style>
</head>

<body>

    <!-- The 90% Safe Border -->
    <div class="page-border"></div>

    <!-- Vertically Centered Content -->
    <div class="content-wrapper">
        <div class="content-cell">

            <img src="{{ $LogoSrc }}" class="block-element logo" alt="Logo">

            <div class="block-element cert-title">Certificate</div>
            <div class="block-element cert-subtitle">of Completion</div>

            <div class="block-element presented-text">THIS CERTIFICATE IS PROUDLY PRESENTED TO</div>

            <div class="block-element">
                <div class="student-name">{{ $FullName }}</div>
            </div>

            <div class="block-element presented-text">FOR SUCCESSFULLY COMPLETING THE</div>

            <div class="block-element course-title">{{ $CourseTitle }}</div>

            <!-- Footer Section -->
            <div class="block-element" style="width: 100%;">
                <table class="footer-table" align="center">
                    <tr>
                        <td align="center" class="footer-item">
                            <strong>Instructor:</strong> {{ $InstructorName }}
                        </td>
                        <td align="center" class="footer-item">
                            <strong>Date of Issue:</strong> {{ $IssueDate }}
                        </td>
                    </tr>
                </table>
            </div>

            <div class="block-element verification">
                Verification Code: {{ $VerificationCode }}
            </div>

        </div>
    </div>

</body>

</html>