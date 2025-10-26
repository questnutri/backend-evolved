CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "canBeDeleted" boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_management_level (
    id uuid PRIMARY KEY,
    "canToggleAdminImpersonation" boolean DEFAULT false,
    "canViewAdmins" boolean DEFAULT false,
    "canViewAdminProfile" boolean DEFAULT false,
    "canCreateAdmin" boolean DEFAULT false,
    "canUpdateAdmin" boolean DEFAULT false,
    "canDeleteAdmin" boolean DEFAULT false,
    "canViewManagementLevels" boolean DEFAULT false,
    "canGrantAdminPermissions" boolean DEFAULT false,
    CONSTRAINT fk_admin_mgmt_admin FOREIGN KEY (id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS nutritionist_management_level (
    id uuid PRIMARY KEY,
    "canViewNutritionists" boolean DEFAULT false,
    "canViewNutritionistProfile" boolean DEFAULT false,
    "canCreateNutritionist" boolean DEFAULT false,
    "canUpdateNutritionist" boolean DEFAULT false,
    "canDeleteNutritionist" boolean DEFAULT false,
    "canViewNutritionistPatients" boolean DEFAULT false,
    "canApproveNutritionist" boolean DEFAULT false,
    CONSTRAINT fk_nutritionist_mgmt_admin FOREIGN KEY (id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS patient_management_level (
    id uuid PRIMARY KEY,
    "canViewPatients" boolean DEFAULT false,
    "canViewPatientProfile" boolean DEFAULT false,
    "canCreatePatient" boolean DEFAULT false,
    "canUpdatePatient" boolean DEFAULT false,
    "canDeletePatient" boolean DEFAULT false,
    CONSTRAINT fk_patient_mgmt_admin FOREIGN KEY (id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS diet_management_level (
    id uuid PRIMARY KEY,
    "canViewDiets" boolean DEFAULT false,
    "canViewDietDetails" boolean DEFAULT false,
    CONSTRAINT fk_diet_mgmt_admin FOREIGN KEY (id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS record_management_level (
    id uuid PRIMARY KEY,
    "canViewRecords" boolean DEFAULT false,
    "canViewRecordDetails" boolean DEFAULT false,
    CONSTRAINT fk_record_mgmt_admin FOREIGN KEY (id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS game_management_level (
    id uuid PRIMARY KEY,
    "canViewGameDetails" boolean DEFAULT false,
    "canViewAchievements" boolean DEFAULT false,
    "canCreateAchievement" boolean DEFAULT false,
    "canUpdateAchievement" boolean DEFAULT false,
    "canDeleteAchievement" boolean DEFAULT false,
    CONSTRAINT fk_game_mgmt_admin FOREIGN KEY (id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS log_management_level (
    id uuid PRIMARY KEY,
    "canViewLogs" boolean DEFAULT false,
    CONSTRAINT fk_log_mgmt_admin FOREIGN KEY (id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO admin (id, "canBeDeleted", created_at, updated_at)
VALUES (
    '7d6e9968-b4db-4b35-8e67-75134632b9f9',
    false,
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO admin_management_level (
    id,
    "canToggleAdminImpersonation",
    "canViewAdmins",
    "canViewAdminProfile",
    "canCreateAdmin",
    "canUpdateAdmin",
    "canDeleteAdmin",
    "canViewManagementLevels",
    "canGrantAdminPermissions"
)
VALUES (
    '7d6e9968-b4db-4b35-8e67-75134632b9f9',
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nutritionist_management_level (
    id,
    "canViewNutritionists",
    "canViewNutritionistProfile",
    "canCreateNutritionist",
    "canUpdateNutritionist",
    "canDeleteNutritionist",
    "canViewNutritionistPatients",
    "canApproveNutritionist"
)
VALUES (
    '7d6e9968-b4db-4b35-8e67-75134632b9f9',
    true,
    true,
    true,
    true,
    true,
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO patient_management_level (
    id,
    "canViewPatients",
    "canViewPatientProfile",
    "canCreatePatient",
    "canUpdatePatient",
    "canDeletePatient"
)
VALUES (
    '7d6e9968-b4db-4b35-8e67-75134632b9f9',
    true,
    true,
    true,
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO diet_management_level (
    id,
    "canViewDiets",
    "canViewDietDetails"
)
VALUES (
    '7d6e9968-b4db-4b35-8e67-75134632b9f9',
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO record_management_level (
    id,
    "canViewRecords",
    "canViewRecordDetails"
)
VALUES (
    '7d6e9968-b4db-4b35-8e67-75134632b9f9',
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_management_level (
    id,
    "canViewGameDetails",
    "canViewAchievements",
    "canCreateAchievement",
    "canUpdateAchievement",
    "canDeleteAchievement"
)
VALUES (
    '7d6e9968-b4db-4b35-8e67-75134632b9f9',
    true,
    true,
    true,
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO log_management_level (
    id,
    "canViewLogs"
)
VALUES (
    '7d6e9968-b4db-4b35-8e67-75134632b9f9',
    true
)
ON CONFLICT (id) DO NOTHING;
