<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260526000001 extends AbstractMigration
{
    public function up(Schema $schema): void
    {
        // Kategorie
        $this->addSql('CREATE TABLE module_categories (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL, icon_class VARCHAR(50) DEFAULT NULL, total_count INT NOT NULL, INDEX IDX_7E5C331A7 (slug), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB');

        // Moduly
        $this->addSql('CREATE TABLE modules (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, is_active TINYINT(1) NOT NULL, is_recommended TINYINT(1) NOT NULL, icon_class VARCHAR(50) DEFAULT NULL, badge_class VARCHAR(100) DEFAULT NULL, install_count INT NOT NULL, rating INT NOT NULL, category_id INT DEFAULT NULL, INDEX IDX_C583B001598687B5 (category_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB');

        // Foreign key
        $this->addSql('ALTER TABLE modules ADD CONSTRAINT FK_C583B001598687B5 FOREIGN KEY (category_id) REFERENCES module_categories (id) ON DELETE CASCADE');

        // Vložení testovacích dat - kategorie
        $this->addSql("INSERT INTO module_categories (name, slug, icon_class, total_count) VALUES
            ('Produkty', 'products', 'bx bx-barcode-alt', 0),
            ('Expedice', 'shipping', 'bx bx-truck', 0),
            ('Pokladna a sklad', 'pos-cashier', 'bx bx-store-alt', 0),
            ('Platební brány', 'payment-gates', 'bx bx-wallet', 0),
            ('Marketing', 'marketing', 'bx bx-bullseye', 0),
            ('E-mail marketing', 'email-marketing', 'bx bx-envelope-open', 0),
            ('Analytics', 'analytics', 'bx bx-bar-chart-alt', 0),
            ('Bezpečnost', 'security', 'bx bx-shield', 0)
        ");

        // Vložení testovacích dat - moduly
        $this->addSql("INSERT INTO modules (name, description, is_active, is_recommended, icon_class, badge_class, install_count, rating, category_id) VALUES
            ('CDN', 'Rychlejší zážitky pro zákazníky pomocí globální distribuce obsahu', 1, 1, 'bx bx-world', 'bg-indigo-100 text-indigo-800', 1247, 4, 1),
            ('Autopilot', 'Automatizace obchodních procesů a pravidelných úloh', 1, 1, 'bx bx-rocket', 'bg-pink-100 text-pink-800', 982, 5, 2),
            ('AI Chatbot', 'Chytrý asistent pro podporu zákazníků 24/7', 1, 1, 'bx bx-bot', 'bg-purple-100 text-purple-800', 856, 4, 3),
            ('Newsletter', 'Vytvářejte a odesílejte e-mailové kampaně přímo z panelu', 0, 1, 'bx bx-paper-plane', 'bg-blue-100 text-blue-800', 234, 3, 4),
            ('Sociální sítě', 'Správa a publikování obsahu na sociálních sítích', 1, 1, 'bx bxl-facebook', 'bg-blue-100 text-blue-800', 1567, 5, 5),
            ('SEO nástroje', 'Zlepšete viditelnost v vyhledávačích a ranking', 1, 1, 'bx bx-search', 'bg-green-100 text-green-800', 1023, 4, 7),
            ('Doručenky', 'Správa doručení a logistiky', 1, 0, 'bx bx-envelope', 'bg-orange-100 text-orange-800', 445, 4, 2),
            ('Faktury', 'Generování a správa faktur', 1, 0, 'bx bx-file', 'bg-yellow-100 text-yellow-800', 312, 3, 5),
            ('Backups', 'Automatické zálohování vašeho e-shopu', 1, 0, 'bx bx-cloud', 'bg-teal-100 text-teal-800', 891, 5, 8),
            ('Cache manager', 'Optimalizace výkonu pomocí smart cache', 1, 1, 'bx bx-lightning', 'bg-red-100 text-red-800', 723, 4, 7),
            ('Multi-lingua', 'Podpora více jazyků v e-shopu', 1, 0, 'bx bx-globe', 'bg-indigo-100 text-indigo-800', 1678, 5, 5),
            ('Live chat', 'Chat podpora v reálném čase', 1, 0, 'bx bx-chat', 'bg-blue-100 text-blue-800', 2156, 5, 3)
        ");

        $this->addSql('UPDATE modules SET category_id = 2 WHERE name IN (\"Doručenky\", \"Autopilot\", \"Doručenky pro SMS\")');
        $this->addSql('UPDATE modules SET category_id = 3 WHERE name IN (\"Newsletter\", \"AI Chatbot\", \"Live chat\")');
        $this->addSql('UPDATE modules SET category_id = 4 WHERE name IN (\"Faktury\", \"Podatelna\", \"Platební metody\")');
        $this->addSql('UPDATE modules SET category_id = 5 WHERE name IN (\"Marketing\", \"Multi-lingua\", \"Faktury\")');
        $this->addSql('UPDATE modules SET category_id = 6 WHERE name = \"E-mail marketing\"');
        $this->addSql('UPDATE modules SET category_id = 7 WHERE name IN (\"SEO nástroje\", \"Analytics\", \"Cache manager\", \"Grafy\")');
        $this->addSql('UPDATE modules SET category_id = 8 WHERE name IN (\"Backups\", \"Security scanner\", \"2FA\", \"SSL\")');
        $this->addSql('UPDATE modules SET category_id = 1 WHERE name IN (\"CDN\", \"Image optimizer\")');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE modules');
        $this->addSql('DROP TABLE module_categories');
    }
}
