CREATE TABLE "meal_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"default_time" time NOT NULL,
	"name" text NOT NULL,
	"consider_time" boolean DEFAULT true NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "meal_type_userId_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "meal_type" ADD CONSTRAINT "meal_type_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Create default meal types for each user
INSERT INTO "meal_type" ("default_time", "name", "consider_time", "user_id")
SELECT '08:00:00'::time, 'Breakfast', true, "id" FROM "auth_user"
UNION ALL
SELECT '10:00:00'::time, 'Brunch', true, "id" FROM "auth_user"
UNION ALL
SELECT '13:00:00'::time, 'Lunch', true, "id" FROM "auth_user"
UNION ALL
SELECT '16:00:00'::time, 'Afternoon Snack', true, "id" FROM "auth_user"
UNION ALL
SELECT '19:00:00'::time, 'Dinner', true, "id" FROM "auth_user";
--> statement-breakpoint

-- Add meal_type_id column (nullable first for migration)
ALTER TABLE "meal" ADD COLUMN "meal_type_id" uuid;--> statement-breakpoint

-- Migrate existing data: map enum values to meal_type_id
UPDATE "meal" m
SET "meal_type_id" = mt.id
FROM "meal_type" mt
WHERE m."user_id" = mt."user_id"
  AND (
    (m."type" = 'BREAKFAST' AND mt."name" = 'Breakfast')
    OR (m."type" = 'BRUNCH' AND mt."name" = 'Brunch')
    OR (m."type" = 'LUNCH' AND mt."name" = 'Lunch')
    OR (m."type" = 'AFTERNOON_SNACK' AND mt."name" = 'Afternoon Snack')
    OR (m."type" = 'DINNER' AND mt."name" = 'Dinner')
  );
--> statement-breakpoint

-- Make meal_type_id NOT NULL after migration
ALTER TABLE "meal" ALTER COLUMN "meal_type_id" SET NOT NULL;--> statement-breakpoint

-- Add foreign key constraint
ALTER TABLE "meal" ADD CONSTRAINT "meal_meal_type_id_meal_type_id_fk" FOREIGN KEY ("meal_type_id") REFERENCES "public"."meal_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Drop old column and enum
ALTER TABLE "meal" DROP COLUMN "type";--> statement-breakpoint
DROP TYPE "public"."MealType";