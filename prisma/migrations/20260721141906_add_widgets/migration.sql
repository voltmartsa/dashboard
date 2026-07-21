-- CreateTable
CREATE TABLE "TimezoneEntry" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimezoneEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherLocation" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherLocation_pkey" PRIMARY KEY ("id")
);
