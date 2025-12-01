import { NotificationMessageI18N } from "../../entities";
import { NotificationType } from "../../enums";

export class CreateNotificationDto {
    userId: string;
    i18n: NotificationMessageI18N;
    type?: NotificationType;
    title?: string;
}